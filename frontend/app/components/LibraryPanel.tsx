"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

import { ApiError } from "../lib/api";
import { copy } from "../lib/copy";
import {
  deleteDocument,
  listDocuments,
  originalDocumentPath,
  replaceDocument,
  retryDocument,
  uploadDocuments,
  type DocumentFailure,
  type DocumentListResponse,
  type DocumentStatus,
  type LibraryDocument,
  type LibraryErrorCategory,
  type UploadResult,
} from "../lib/library";
import type { Language, Space } from "../lib/types";
import { createNote, readSource, updateNote, type Source } from "../lib/knowledge";
import { TextSourceView } from "./TextSourceView";

const POLL_INTERVAL_MS = 3000;

const categoryKey = {
  permission: "libraryPermission",
  limit: "libraryLimit",
  format: "libraryFormat",
  budget: "libraryBudget",
  provider: "libraryProvider",
  conflict: "libraryConflict",
  unknown: "libraryUnknown",
} as const satisfies Record<LibraryErrorCategory, string>;

const statusKey = {
  pending: "statusPending",
  processing: "statusProcessing",
  available: "statusAvailable",
  failed: "statusFailed",
  unsupported: "statusUnsupported",
} as const satisfies Record<DocumentStatus, string>;

const sourceKey = {
  file: "sourceFile",
  note: "sourceNote",
  url: "sourceUrl",
  github: "sourceGithub",
} as const satisfies Record<LibraryDocument["source"], string>;

type CategoryKey = typeof categoryKey[LibraryErrorCategory];
type NoticeKey = CategoryKey | "libraryNotFound" | "rateLimited" | "uploadTooMany" | "documentReplaced" | "documentRetried" | "documentDeleted" | "documentDeleting";
type LoadError = "" | "libraryPermission" | "libraryLoadError";

function isCategory(value: string): value is LibraryErrorCategory {
  return value in categoryKey;
}

function failureKey(failure: DocumentFailure | null): CategoryKey {
  return categoryKey[failure && isCategory(failure.category) ? failure.category : "unknown"];
}

function isForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403 && (error.category === "" || error.category === "permission");
}

function errorKey(error: unknown, onDocument: boolean): NoticeKey {
  if (!(error instanceof ApiError)) return "libraryUnknown";
  if (isCategory(error.category)) return categoryKey[error.category];
  return error.status === 404 && onDocument ? "libraryNotFound"
    : error.status === 409 ? "libraryConflict"
      : error.status === 413 ? "libraryLimit"
        : error.status === 415 ? "libraryFormat"
          : error.status === 429 ? "rateLimited" : "libraryUnknown";
}

function inProgress(document: LibraryDocument) {
  return document.status === "pending" || document.status === "processing"
    || document.replacement?.status === "pending" || document.replacement?.status === "processing";
}

function canRetry(document: LibraryDocument) {
  return Boolean(document.failure?.retryable || (document.replacement?.status === "failed" && document.replacement.failure?.retryable));
}

function formatSize(bytes: number | null, language: Language) {
  if (bytes === null) return "—";
  const units = ["B", "kB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  return `${new Intl.NumberFormat(language, { maximumFractionDigits: unit === 0 ? 0 : 1 }).format(value)} ${units[unit]}`;
}

function formatDate(value: string, language: Language) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function LibraryPanel({
  language,
  space,
  csrfToken,
  onSessionExpired,
  onForbidden,
}: {
  language: Language;
  space: Space;
  csrfToken: string;
  onSessionExpired: () => void;
  onForbidden: () => void;
}) {
  const t = copy[language];
  const spaceId = space.id;
  const canEdit = space.role === "admin" || space.role === "editor";
  const [library, setLibrary] = useState<DocumentListResponse | null>(null);
  const [loadError, setLoadError] = useState<LoadError>("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{ key: NoticeKey; error: boolean } | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [listVersion, setListVersion] = useState(0);
  const [viewerId, setViewerId] = useState("");
  const [viewerSource, setViewerSource] = useState<Source | null>(null);
  const [viewerBusy, setViewerBusy] = useState(false);
  const [dialogMode, setDialogMode] = useState<"source" | "edit" | null>(null);
  const [noteEditor, setNoteEditor] = useState<{ documentId?: string; title: string; body: string; operationKey: string } | null>(null);
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteNotice, setNoteNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const noteController = useRef<AbortController | null>(null);
  const spaceEpoch = useRef(0);
  const listInFlight = useRef(false);
  const loaded = useRef(false);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<LibraryDocument | null>(null);

  useEffect(() => () => {
    spaceEpoch.current += 1;
    noteController.current?.abort();
  }, [spaceId]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (dialogMode && !element.open) element.showModal();
    if (!dialogMode && element.open) element.close();
  }, [dialogMode]);

  useEffect(() => {
    if (dialogMode !== "source" || !viewerId) return;
    const controller = new AbortController();
    const epoch = spaceEpoch.current;
    readSource(spaceId, viewerId, controller.signal)
      .then(({ source }) => {
        if (epoch === spaceEpoch.current && !controller.signal.aborted) setViewerSource(source);
      })
      .catch((error: unknown) => {
        if (epoch !== spaceEpoch.current || controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) onSessionExpired();
        else if (isForbidden(error)) onForbidden();
        else setNoteError(t.noteLoadError);
      })
      .finally(() => { if (epoch === spaceEpoch.current && !controller.signal.aborted) setViewerBusy(false); });
    return () => controller.abort();
  }, [dialogMode, viewerId, spaceId, onSessionExpired, onForbidden, t]);

  useEffect(() => {
    const controller = new AbortController();
    const epoch = spaceEpoch.current;
    const stillCurrent = () => epoch === spaceEpoch.current && !controller.signal.aborted;
    async function load() {
      listInFlight.current = true;
      try {
        const next = await listDocuments(spaceId, controller.signal);
        if (!stillCurrent()) return;
        loaded.current = true;
        setLibrary(next);
        setLoadError("");
      } catch (error) {
        if (!stillCurrent()) return;
        if (error instanceof ApiError && error.status === 401) {
          onSessionExpired();
        } else if (isForbidden(error)) {
          setLibrary(null);
          if (loaded.current) onForbidden();
          else setLoadError("libraryPermission");
        } else {
          setLoadError("libraryLoadError");
        }
      } finally {
        if (stillCurrent()) listInFlight.current = false;
      }
    }
    void load();
    return () => {
      controller.abort();
      listInFlight.current = false;
    };
  }, [spaceId, listVersion, onSessionExpired, onForbidden]);

  const polling = library?.documents.some(inProgress) ?? false;

  useEffect(() => {
    if (!polling) return;
    let timer = 0;
    const sync = () => {
      window.clearInterval(timer);
      timer = 0;
      if (document.visibilityState !== "visible") return;
      timer = window.setInterval(() => {
        if (!listInFlight.current) setListVersion((version) => version + 1);
      }, POLL_INTERVAL_MS);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [polling]);

  const refresh = () => setListVersion((version) => version + 1);

  async function mutate(action: string, onDocument: boolean, task: () => Promise<NoticeKey | "">) {
    if (busy) return;
    const epoch = spaceEpoch.current;
    setBusy(action);
    setNotice(null);
    try {
      const done = await task();
      if (epoch !== spaceEpoch.current) return;
      if (done) setNotice({ key: done, error: false });
      refresh();
    } catch (error) {
      if (epoch !== spaceEpoch.current) return;
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
      } else if (isForbidden(error)) {
        onForbidden();
      } else {
        setNotice({ key: errorKey(error, onDocument), error: true });
        refresh();
      }
    } finally {
      if (epoch === spaceEpoch.current) setBusy("");
    }
  }

  function upload(files: File[]) {
    if (busy || !library || files.length === 0) return;
    setUploadResults(null);
    if (files.length > library.limits.maxFilesPerUpload) {
      setNotice({ key: "uploadTooMany", error: true });
      return;
    }
    const accepted = files.filter((file) => file.size <= library.limits.maxFileBytes);
    const oversized: UploadResult[] = files
      .filter((file) => file.size > library.limits.maxFileBytes)
      .map((file) => ({ name: file.name, accepted: false, category: "limit" }));
    if (accepted.length === 0) {
      setNotice(null);
      setUploadResults(oversized);
      return;
    }
    const epoch = spaceEpoch.current;
    void mutate("upload", false, async () => {
      const { results } = await uploadDocuments(spaceId, accepted, csrfToken);
      if (epoch === spaceEpoch.current) setUploadResults([...results, ...oversized]);
      return "";
    });
  }

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    upload(files);
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    upload(Array.from(event.dataTransfer.files));
  }

  function startReplace(document: LibraryDocument) {
    if (busy) return;
    replaceTarget.current = document;
    replaceInput.current?.click();
  }

  function chooseReplacement(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const target = replaceTarget.current;
    event.target.value = "";
    replaceTarget.current = null;
    if (!file || !target || !library) return;
    if (file.size > library.limits.maxFileBytes) {
      setNotice({ key: "libraryLimit", error: true });
      return;
    }
    void mutate(`replace-${target.id}`, true, async () => {
      await replaceDocument(spaceId, target.id, file, csrfToken);
      return "documentReplaced";
    });
  }

  function retry(target: LibraryDocument) {
    void mutate(`retry-${target.id}`, true, async () => {
      await retryDocument(spaceId, target.attempt.taskId, csrfToken);
      return "documentRetried";
    });
  }

  function remove(target: LibraryDocument) {
    if (busy || !window.confirm(t.confirmDeleteDocument(target.name))) return;
    void mutate(`delete-${target.id}`, true, async () => {
      const result = await deleteDocument(spaceId, target.id, csrfToken);
      setLibrary((current) => current && { ...current, documents: current.documents.filter((item) => item.id !== target.id) });
      return result.status === "deleted" ? "documentDeleted" : "documentDeleting";
    });
  }

  function openSource(document: LibraryDocument) {
    setViewerId(document.id);
    setViewerSource(null);
    setViewerBusy(true);
    setNoteError("");
    setNoteNotice("");
    setDialogMode("source");
  }

  function startNote() {
    setNoteEditor({ title: "", body: "", operationKey: "" });
    setNoteError("");
    setDialogMode("edit");
  }

  function editCurrentNote() {
    if (!viewerSource || viewerSource.kind !== "note" || !canEdit) return;
    setNoteEditor({ documentId: viewerSource.documentId, title: viewerSource.title, body: viewerSource.content, operationKey: "" });
    setNoteError("");
    setDialogMode("edit");
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteEditor || noteBusy || !canEdit) return;
    if (new TextEncoder().encode(noteEditor.body).byteLength > 1_048_576) {
      setNoteError(t.noteBodyTooLarge);
      return;
    }
    const epoch = spaceEpoch.current;
    const controller = new AbortController();
    noteController.current = controller;
    const operationKey = noteEditor.operationKey || crypto.randomUUID();
    const payload = { title: noteEditor.title, body: noteEditor.body, operationKey };
    setNoteEditor({ ...noteEditor, operationKey });
    setNoteBusy(true);
    setNoteError("");
    setNoteNotice("");
    try {
      if (noteEditor.documentId) await updateNote(spaceId, noteEditor.documentId, csrfToken, payload, controller.signal);
      else await createNote(spaceId, csrfToken, payload, controller.signal);
      if (epoch !== spaceEpoch.current || controller.signal.aborted) return;
      setNoteBusy(false);
      setNoteEditor(null);
      setDialogMode(null);
      setNoteNotice(t.noteSaved);
      refresh();
    } catch (error) {
      if (epoch !== spaceEpoch.current || controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) onSessionExpired();
      else if (isForbidden(error)) onForbidden();
      else if (error instanceof ApiError && error.status === 413) setNoteError(t.noteBodyTooLarge);
      else if (error instanceof ApiError && error.status === 404) setNoteError(t.libraryNotFound);
      else if (error instanceof ApiError && error.status === 409) setNoteError(t.libraryConflict);
      else if (error instanceof ApiError && error.status === 429) setNoteError(t.libraryBudget);
      else if (error instanceof ApiError && error.category === "provider") setNoteError(t.libraryProvider);
      else setNoteError(t.libraryUnknown);
    } finally {
      if (epoch === spaceEpoch.current && !controller.signal.aborted) setNoteBusy(false);
    }
  }

  function closeDialog() {
    if (noteBusy) return;
    noteController.current?.abort();
    setDialogMode(null);
    setViewerId("");
    setViewerSource(null);
    setViewerBusy(false);
    setNoteEditor(null);
    setNoteError("");
  }

  const documents = library?.documents ?? [];
  const needle = query.trim().toLocaleLowerCase(language);
  const visible = needle
    ? documents.filter((item) => `${item.name} ${t[sourceKey[item.source]] ?? ""} ${item.format}`.toLocaleLowerCase(language).includes(needle))
    : documents;
  const acceptedCount = uploadResults?.filter((result) => result.accepted).length ?? 0;
  const size = (bytes: number | null) => formatSize(bytes, language);
  const count = (value: number) => new Intl.NumberFormat(language).format(value);

  return (
    <section className="library" aria-label={t.libraryTitle} aria-busy={busy !== "" || (!library && !loadError)}>
      {library?.budget?.exhausted && (
        <p className="budget-banner" role="status">
          <BudgetIcon />
          <span><strong>{t.budgetExhaustedTitle}</strong> {t.budgetExhausted}</span>
        </p>
      )}

      <div className="upload-results" role={uploadResults ? (acceptedCount === 0 ? "alert" : "status") : undefined} aria-live="polite">
        {uploadResults && (
          <>
            <p className={acceptedCount === uploadResults.length ? "upload-summary" : "upload-summary partial"}>
              <strong>{t.uploadSummary(acceptedCount, uploadResults.length)}</strong>
              {acceptedCount > 0 && <> {t.uploadAcceptedNote}</>}
            </p>
            <ul>
              {uploadResults.map((result, index) => (
                <li key={`${index}-${result.name}`} className={result.accepted ? "upload-result" : "upload-result rejected"}>
                  {result.accepted ? <StatusIcon status={result.document.status} /> : <StatusIcon status="failed" />}
                  <span className="upload-result-name">{result.name}</span>
                  <span>
                    {result.accepted
                      ? `${t.uploadAccepted}: ${t[statusKey[result.document.status]]}`
                      : `${t.uploadRejected}: ${t[categoryKey[isCategory(result.category) ? result.category : "unknown"]]}`}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="notice" role={notice ? (notice.error ? "alert" : "status") : undefined} aria-live="polite">
        {notice ? t[notice.key] : ""}
      </p>
      <p className="notice" role={noteNotice ? "status" : undefined} aria-live="polite">{noteNotice}</p>

      {loadError && (
        <p className="library-load-error" role="alert">
          <span>{t[loadError]}</span>
          <button className="button quiet" type="button" onClick={refresh}>{t.retryLoad}</button>
        </p>
      )}

      <div className="library-columns">
        <div className="library-card">
          <div className="library-toolbar">
            <label className="search-field" htmlFor="library-search">
              <span className="sr-only">{t.searchDocuments}</span>
              <SearchIcon />
              <input id="library-search" type="search" placeholder={t.searchDocuments} value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            {canEdit && <button className="button primary" type="button" onClick={startNote}>{t.noteCreate}</button>}
            {library && <span className="member-count" aria-label={t.documentCount(documents.length)}>{documents.length}</span>}
          </div>
          {!library ? (
            !loadError && <p className="empty-line" role="status">{t.libraryLoading}</p>
          ) : documents.length === 0 ? (
            <p className="empty-line library-empty">{canEdit ? t.libraryEmptyEditor : t.libraryEmpty}</p>
          ) : visible.length === 0 ? (
            <p className="empty-line library-empty" role="status">{t.noMatches}</p>
          ) : (
            <div className="table-scroll" role="region" aria-label={t.documentListLabel} tabIndex={0}>
              <table className="document-table">
                <thead>
                  <tr>
                    <th scope="col">{t.documentName}</th>
                    <th scope="col">{t.documentSource}</th>
                    <th scope="col">{t.documentFormat}</th>
                    <th scope="col">{t.documentSize}</th>
                    <th scope="col">{t.documentStatus}</th>
                    <th scope="col">{t.documentActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => {
                    const updated = formatDate(item.updatedAt, language);
                    return (
                      <tr key={item.id}>
                        <th scope="row">
                          <span className="document-name">{item.name}</span>
                          {updated && <span className="document-meta">{t.documentUpdated(updated)}</span>}
                        </th>
                        <td>{t[sourceKey[item.source]] ?? item.source}</td>
                        <td className="document-format">{item.format}</td>
                        <td className="document-size">{size(item.sizeBytes)}</td>
                        <td>
                          <span className={`status-badge ${item.status}`}>
                            <StatusIcon status={item.status} />{t[statusKey[item.status]] ?? item.status}
                          </span>
                          {(item.status === "pending" || item.status === "processing") && <span className="status-detail">{t.notQueryableYet}</span>}
                          {item.status === "unsupported" && !item.failure && <span className="status-detail">{t.unsupportedDetail}</span>}
                          {(item.status === "failed" || item.failure) && <span className="status-detail">{t[failureKey(item.failure)]}</span>}
                          {item.replacement && (
                            <span className={`replacement-line ${item.replacement.status}`}>
                              <StatusIcon status={item.replacement.status} />
                              <span>
                                {item.replacement.status === "failed" ? t.replacementFailed : t.replacementInProgress}
                                {item.replacement.status === "failed" && <> {t[failureKey(item.replacement.failure)]}</>}
                              </span>
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="document-actions">
                            <a className="button quiet" href={originalDocumentPath(spaceId, item.id)} download aria-label={t.downloadOriginalFor(item.name)}>{t.downloadOriginal}</a>
                            {item.status === "available" && (item.source === "note" || item.format === "txt") && <button className="button quiet" type="button" onClick={() => openSource(item)} aria-label={`${t.sourceOpen}: ${item.name}`}>{t.sourceOpen}</button>}
                            {canEdit && (
                              <>
                                {item.source !== "note" && <button className="button quiet" type="button" disabled={busy !== ""} aria-label={t.replaceFor(item.name)} onClick={() => startReplace(item)}>
                                  {busy === `replace-${item.id}` ? t.busy : t.replaceDocument}
                                </button>}
                                {canRetry(item) && (
                                  <button className="button quiet" type="button" disabled={busy !== ""} aria-label={t.retryFor(item.name)} onClick={() => retry(item)}>
                                    {busy === `retry-${item.id}` ? t.busy : t.retryDocument}
                                  </button>
                                )}
                                <button className="button quiet destructive" type="button" disabled={busy !== ""} aria-label={t.deleteFor(item.name)} onClick={() => remove(item)}>
                                  {busy === `delete-${item.id}` ? t.busy : t.deleteDocument}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="library-aside">
          {canEdit ? (
            <div className="library-upload">
              <label
                className={dragging ? "drop-zone dragging" : "drop-zone"}
                htmlFor="library-files"
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={drop}
              >
                <input id="library-files" className="sr-only" type="file" multiple disabled={busy !== "" || !library} onChange={chooseFiles} aria-describedby="library-limits" />
                <span className="drop-badge"><UploadIcon /></span>
                <strong>{busy === "upload" ? t.uploading : t.dropLabel}</strong>
                <span id="library-limits">
                  {library ? t.uploadLimits(size(library.limits.maxFileBytes), count(library.limits.maxFilesPerUpload), count(library.limits.maxDocuments)) : t.libraryLoading}
                </span>
              </label>
              <input ref={replaceInput} type="file" hidden tabIndex={-1} aria-hidden="true" onChange={chooseReplacement} />
            </div>
          ) : (
            <p className="info-card">{t.readerLibraryNote}</p>
          )}
          <div className="info-card accent">
            <h2>{t.externalTitle}</h2>
            <p>{t.openaiNotice}</p>
          </div>
          <div className="info-card">
            <h2>{t.deleteInfoTitle}</h2>
            <p>{t.deleteInfo}</p>
          </div>
        </aside>
      </div>
      <dialog ref={dialog} className="source-dialog" aria-labelledby="source-dialog-title" onCancel={(event) => { if (noteBusy) event.preventDefault(); }} onClose={() => { noteController.current?.abort(); setNoteBusy(false); setViewerBusy(false); setDialogMode(null); setNoteEditor(null); setViewerId(""); setViewerSource(null); }}>
        <div className="source-dialog-heading">
          <div><p className="eyebrow">{dialogMode === "edit" ? t.sourceNote : viewerSource?.kind === "note" ? t.sourceNote : t.sourceFile}</p><h2 id="source-dialog-title">{dialogMode === "edit" ? (noteEditor?.documentId ? t.noteEdit : t.noteCreate) : viewerSource?.title ?? t.sourceDialog}</h2></div>
          <button className="button quiet" type="button" onClick={closeDialog} disabled={noteBusy}>{t.noteCancel}</button>
        </div>
        {dialogMode === "edit" && noteEditor ? (
          <form className="note-editor" onSubmit={(event) => void saveNote(event)} aria-busy={noteBusy}>
            <label htmlFor="note-title">{t.noteTitle}</label>
            <input id="note-title" required maxLength={255} value={noteEditor.title} onChange={(event) => setNoteEditor({ ...noteEditor, title: event.target.value, operationKey: "" })} />
            <label htmlFor="note-body">{t.noteBody}</label>
            <textarea id="note-body" required rows={14} value={noteEditor.body} onChange={(event) => setNoteEditor({ ...noteEditor, body: event.target.value, operationKey: "" })} aria-describedby="note-body-hint" />
            <p className="field-hint" id="note-body-hint">{t.noteBodyHint} {new Intl.NumberFormat(language).format(new TextEncoder().encode(noteEditor.body).byteLength)} / 1,048,576 bytes</p>
            {noteError && <p className="notice" role="alert">{noteError}</p>}
            <div className="composer-footer"><span>{t.noteBodyHint}</span><button className="button primary" type="submit" disabled={noteBusy || !noteEditor.title.trim() || !noteEditor.body.length}>{noteBusy ? t.noteSaving : t.noteSave}</button></div>
          </form>
        ) : (
          <>
            {viewerBusy && <p role="status">{t.libraryLoading}</p>}
            {noteError && <p role="alert">{noteError}</p>}
            {viewerSource && <>
              <p className="source-meta">{viewerSource.kind === "note" ? t.sourceNote : t.sourceFile} · {viewerSource.lineCount} {language === "es" ? "líneas" : "lines"}</p>
              <TextSourceView source={viewerSource} />
              {viewerSource.kind === "note" && (canEdit ? <div className="source-actions"><button className="button primary" type="button" onClick={editCurrentNote}>{t.noteEdit}</button></div> : <p className="historical-warning">{t.noteReadOnly}</p>)}
            </>}
            {!viewerBusy && !viewerSource && !noteError && <p role="status">{t.noteLoadError}</p>}
          </>
        )}
      </dialog>
    </section>
  );
}

function StatusIcon({ status }: { status: DocumentStatus }) {
  return (
    <svg className="status-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {status === "pending" && <><circle cx="8" cy="8" r="6.2" /><path d="M8 4.6V8l2.3 1.5" /></>}
      {status === "processing" && <><circle cx="8" cy="8" r="6.2" strokeDasharray="2.6 2.6" /><circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" /></>}
      {status === "available" && <><circle cx="8" cy="8" r="6.2" /><path d="m5.2 8.2 2 2 3.7-4.2" /></>}
      {status === "failed" && <><path d="M8 2 14.4 13.4H1.6Z" /><path d="M8 6.4v3.2M8 11.5v.1" /></>}
      {status === "unsupported" && <><rect x="2" y="2" width="12" height="12" rx="2" /><path d="m4.6 11.4 6.8-6.8" /></>}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="drop-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg className="status-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" /><path d="M6.4 5.4v5.2M9.6 5.4v5.2" />
    </svg>
  );
}
