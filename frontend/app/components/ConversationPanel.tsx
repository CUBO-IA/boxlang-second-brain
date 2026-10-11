"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { ApiError } from "../lib/api";
import { handleAuthorizationFailure } from "../lib/authorization-error.mjs";
import {
  createConversation,
  listConversations,
  readConversation,
  resolveCitation,
  sendMessage,
  setConversationShared,
  type AssistantMessage,
  type Citation,
  type Conversation,
  type Message,
  type Scope,
} from "../lib/knowledge";
import { listDocuments, type LibraryDocument } from "../lib/library";
import { copy } from "../lib/copy";
import type { Language, Space } from "../lib/types";
import { TextSourceView } from "./TextSourceView";

type Resolved = { citation: Citation; source?: Awaited<ReturnType<typeof resolveCitation>>["source"] };

function messageError(error: unknown, t: typeof copy[Language]) {
  if (!(error instanceof ApiError)) return t.chatError;
  if (error.status === 401) return t.sessionExpired;
  if (error.status === 403) return t.chatDenied;
  if (error.status === 404) return t.chatUnavailable;
  if (error.status === 409) return t.chatConflict;
  if (error.status === 413) return t.chatRequestTooLarge;
  if (error.status === 429 || error.category === "budget") return t.chatBudget;
  if (error.status === 503 || error.category === "provider") return t.chatProvider;
  return t.chatError;
}

function focusLine(source: NonNullable<Resolved["source"]>, citation: Citation) {
  const offset = citation.location.startOffset;
  if (!Number.isInteger(offset) || offset! < 0) return citation.location.lineStart;
  let cursor = 0;
  for (const line of source.lines) {
    const end = cursor + [...line.text].length;
    if (offset! <= end) return line.line;
    cursor = end + 1;
  }
  return source.lines.at(-1)?.line;
}

function citationLocation(citation: Citation, language: Language) {
  const pageStart = citation.location.pageStart;
  const pageEnd = citation.location.pageEnd;
  if (pageStart && pageEnd) return language === "es" ? `Páginas ${pageStart}–${pageEnd}` : `Pages ${pageStart}–${pageEnd}`;
  const start = citation.location.lineStart;
  const end = citation.location.lineEnd;
  if (start && end) return language === "es" ? `Líneas ${start}–${end}` : `Lines ${start}–${end}`;
  return language === "es" ? "Fragmento de texto" : "Text fragment";
}

export function ConversationPanel({
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [conversationOffset, setConversationOffset] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [scopeMode, setScopeMode] = useState<Scope["mode"]>("space");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextAfter, setNextAfter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [resolvingId, setResolvingId] = useState("");
  const detailEpoch = useRef(0);
  const citationController = useRef<AbortController | null>(null);
  const listController = useRef<AbortController | null>(null);
  const actionControllers = useRef(new Set<AbortController>());

  function startAction() {
    const controller = new AbortController();
    actionControllers.current.add(controller);
    return controller;
  }

  function abortActions() {
    for (const controller of actionControllers.current) controller.abort();
    actionControllers.current.clear();
  }

  const loseConversation = useCallback((id: string) => {
    detailEpoch.current++;
    abortActions();
    citationController.current?.abort();
    citationController.current = null;
    setConversations((items) => items.filter((item) => item.id !== id));
    setSelectedId("");
    setMessages([]);
    setActive(null);
    setResolved(null);
    setResolvingId("");
    setHasMore(false);
    setNextAfter(0);
    setLoading(false);
    setQuestion("");
    setScopeMode("space");
    setSelectedDocuments([]);
    setBusy("");
    setError(t.chatUnavailable);
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    void listConversations(space.id, 0, 50, controller.signal).then((result) => {
      if (controller.signal.aborted || listController.current !== controller) return;
      setConversations(result.conversations);
      setHasMoreConversations(result.hasMore);
      setConversationOffset(result.offset + result.conversations.length);
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onSessionExpired();
      else onForbidden();
    });
  }, [space.id, onSessionExpired, onForbidden, t.chatUnavailable]);

  useEffect(() => () => {
    detailEpoch.current++;
    citationController.current?.abort();
    listController.current?.abort();
    for (const controller of actionControllers.current) controller.abort();
    actionControllers.current.clear();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let activeRequest = true;
    Promise.all([listConversations(space.id, 0, 50, controller.signal), listDocuments(space.id, controller.signal)])
      .then(([result, library]) => {
        if (!activeRequest) return;
        setConversations(result.conversations);
        setHasMoreConversations(result.hasMore);
        setConversationOffset(result.offset + result.conversations.length);
        setDocuments(library.documents.filter((item) => item.status === "available"));
        setSelectedId((current) => current && result.conversations.some((item) => item.id === current) ? current : result.conversations[0]?.id ?? "");
        setLoading(false);
      })
      .catch((failure: unknown) => {
        if (!activeRequest || controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) onSessionExpired();
        else if (failure instanceof ApiError && failure.status === 403) onForbidden();
        else setError(messageError(failure, t));
        setLoading(false);
      });
    return () => { activeRequest = false; controller.abort(); };
  }, [space.id, onSessionExpired, onForbidden, t]);

  useEffect(() => {
    const epoch = ++detailEpoch.current;
    citationController.current?.abort();
    citationController.current = null;
    if (!selectedId) return;
    const controller = new AbortController();
    readConversation(selectedId, 0, controller.signal)
      .then((result) => {
        if (epoch !== detailEpoch.current || controller.signal.aborted) return;
        setActive(result.conversation);
        setMessages(result.messages);
        setNextAfter(result.nextAfter);
        setHasMore(result.hasMore);
      })
      .catch((failure: unknown) => {
        if (epoch !== detailEpoch.current || controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) onSessionExpired();
        else if (failure instanceof ApiError && failure.status === 403) onForbidden();
        else if (failure instanceof ApiError && failure.status === 404) loseConversation(selectedId);
        else setError(messageError(failure, t));
      })
      .finally(() => { if (epoch === detailEpoch.current) setLoading(false); });
    return () => { controller.abort(); };
  }, [selectedId, onSessionExpired, onForbidden, loseConversation, t]);

  function selectConversation(id: string) {
    if (id === selectedId) return;
    detailEpoch.current++;
    abortActions();
    citationController.current?.abort();
    citationController.current = null;
    setSelectedId(id);
    setMessages([]);
    setActive(null);
    setResolved(null);
    setResolvingId("");
    setHasMore(false);
    setNextAfter(0);
    setError("");
    setQuestion("");
    setScopeMode("space");
    setSelectedDocuments([]);
    setBusy("");
    setLoading(Boolean(id));
  }

  async function loadMoreConversations() {
    if (!hasMoreConversations || loadingConversations) return;
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    setLoadingConversations(true);
    try {
      const result = await listConversations(space.id, conversationOffset, 50, controller.signal);
      if (controller.signal.aborted || listController.current !== controller) return;
      setConversations((items) => [...new Map([...items, ...result.conversations].map((item) => [item.id, item])).values()]);
      setConversationOffset(result.offset + result.conversations.length);
      setHasMoreConversations(result.hasMore);
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onSessionExpired();
      else if (failure instanceof ApiError && failure.status === 403) onForbidden();
      else setError(messageError(failure, t));
    } finally {
      if (!controller.signal.aborted && listController.current === controller) setLoadingConversations(false);
    }
  }

  async function createNew() {
    if (busy) return;
    const controller = startAction();
    setBusy("create");
    setError("");
    try {
      const result = await createConversation(space.id, csrfToken, controller.signal);
      if (controller.signal.aborted) return;
      setConversations((items) => [result.conversation, ...items.filter((item) => item.id !== result.conversation.id)].slice(0, 50));
      selectConversation(result.conversation.id);
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onSessionExpired();
      else setError(messageError(failure, t));
    } finally { actionControllers.current.delete(controller); if (!controller.signal.aborted) setBusy(""); }
  }

  async function loadOlder() {
    if (!active || busy || !hasMore) return;
    const id = selectedId;
    const epoch = detailEpoch.current;
    const controller = startAction();
    setBusy("older");
    try {
      const result = await readConversation(id, nextAfter, controller.signal);
      if (controller.signal.aborted || epoch !== detailEpoch.current || id !== selectedId) return;
      setMessages((items) => [...items, ...result.messages]);
      setNextAfter(result.nextAfter);
      setHasMore(result.hasMore);
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (handleAuthorizationFailure(failure, () => epoch === detailEpoch.current, { onSessionExpired, onForbidden })) return;
      if (failure instanceof ApiError && failure.status === 404) loseConversation(id);
      else setError(messageError(failure, t));
    } finally { actionControllers.current.delete(controller); if (!controller.signal.aborted && epoch === detailEpoch.current) setBusy(""); }
  }

  async function toggleShared() {
    if (!active?.canContinue || busy) return;
    const epoch = detailEpoch.current;
    const controller = startAction();
    setBusy("share");
    setError("");
    try {
      const result = await setConversationShared(active.id, csrfToken, !active.shared, controller.signal);
      if (controller.signal.aborted) return;
      if (epoch !== detailEpoch.current) return;
      setActive((current) => current?.id === result.conversation.id ? { ...current, shared: result.conversation.shared } : current);
      setConversations((items) => items.map((item) => item.id === result.conversation.id ? { ...item, shared: result.conversation.shared } : item));
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (handleAuthorizationFailure(failure, () => epoch === detailEpoch.current, { onSessionExpired, onForbidden })) return;
      if (failure instanceof ApiError && failure.status === 404) loseConversation(active.id);
      else setError(messageError(failure, t));
    } finally { actionControllers.current.delete(controller); if (!controller.signal.aborted && epoch === detailEpoch.current) setBusy(""); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active?.canContinue || busy || hasMore || !question.trim()) return;
    const selected = selectedDocuments.filter((id) => documents.some((doc) => doc.id === id));
    const scope: Scope = scopeMode === "space" ? { mode: "space" } : { mode: "documents", documentIds: selected };
    if (scope.mode === "documents" && !scope.documentIds.length) return;
    if (new TextEncoder().encode(question).byteLength > 4096) { setError(t.chatQuestionTooLong); return; }
    const id = active.id;
    const epoch = detailEpoch.current;
    const controller = startAction();
    setBusy("send");
    setError("");
    try {
      const result = await sendMessage(id, csrfToken, question, scope, controller.signal);
      if (controller.signal.aborted || epoch !== detailEpoch.current || id !== selectedId) return;
      setMessages((items) => [...items, result.userMessage, result.assistantMessage]);
      setActive(result.conversation);
      setQuestion("");
      setNextAfter(result.assistantMessage.sequence);
      setConversations((items) => [result.conversation, ...items.filter((item) => item.id !== id)].slice(0, 50));
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onSessionExpired();
      else if (failure instanceof ApiError && failure.status === 403) onForbidden();
      else if (failure instanceof ApiError && failure.status === 404) loseConversation(id);
      else setError(messageError(failure, t));
    } finally { actionControllers.current.delete(controller); if (!controller.signal.aborted && epoch === detailEpoch.current) setBusy(""); }
  }

  async function openCitation(message: AssistantMessage, citation: Citation) {
    citationController.current?.abort();
    const controller = new AbortController();
    citationController.current = controller;
    const epoch = detailEpoch.current;
    setResolved(null);
    setResolvingId(citation.id);
    setError("");
    try {
      let result: Awaited<ReturnType<typeof resolveCitation>>;
      try {
        result = await resolveCitation(selectedId, message.id, citation.id, controller.signal);
      } catch (failure) {
        if (!(failure instanceof ApiError) || failure.status !== 409 || controller.signal.aborted) throw failure;
        // A replacement may land between the resolver's status check and source read; recheck before showing history.
        result = await resolveCitation(selectedId, message.id, citation.id, controller.signal);
      }
      if (controller.signal.aborted || epoch !== detailEpoch.current || selectedId !== active?.id) return;
      setResolved(result);
    } catch (failure) {
      if (controller.signal.aborted || epoch !== detailEpoch.current) return;
      if (failure instanceof ApiError && failure.status === 401) onSessionExpired();
      else if (failure instanceof ApiError && failure.status === 403) onForbidden();
      else if (failure instanceof ApiError && failure.status === 404) loseConversation(selectedId);
      else setError(messageError(failure, t));
    } finally {
      if (!controller.signal.aborted && epoch === detailEpoch.current) setResolvingId("");
    }
  }

  const canContinue = active?.canContinue === true;
  const citationSource = resolved?.citation.status === "current" ? resolved.source : undefined;
  const usableRange = resolved?.citation.location.startOffset !== undefined && resolved.citation.location.endOffset !== undefined
    ? { startOffset: resolved.citation.location.startOffset, endOffset: resolved.citation.location.endOffset } : undefined;
  const names = new Map(documents.map((item) => [item.id, item.name]));

  return (
    <section className="chat-panel" aria-label={t.chatTitle} aria-busy={loading || busy !== ""}>
      <div className="chat-toolbar">
        <p className="notice" role={error ? "alert" : undefined} aria-live="polite">{error}</p>
        <p className="chat-retention">{t.chatRetention}</p>
      </div>
      <div className="chat-layout">
        <aside className="conversation-list" aria-label={t.conversationsLabel}>
          <div className="conversation-list-heading"><h2>{t.conversationsTitle}</h2><button className="button primary" type="button" onClick={() => void createNew()} disabled={busy !== ""}>{busy === "create" ? t.busy : t.newConversation}</button></div>
          {loading && !conversations.length ? <p className="empty-line" role="status">{t.chatLoading}</p> : conversations.length === 0 ? <p className="empty-line">{t.chatEmpty}</p> : (
            <ul className="conversation-items">
              {conversations.map((item) => (
                <li key={item.id}>
                  <button type="button" className={item.id === selectedId ? "conversation-choice selected" : "conversation-choice"} aria-current={item.id === selectedId ? "page" : undefined} onClick={() => selectConversation(item.id)}>
                    <span>{item.canContinue ? t.conversationMine : t.conversationShared}</span>
                    <small>{new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.updatedAt))}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {hasMoreConversations && <button className="button quiet full-width" type="button" onClick={() => void loadMoreConversations()} disabled={loadingConversations}>{loadingConversations ? t.chatLoading : t.moreConversations}</button>}
        </aside>

        <div className="conversation-main">
          {active ? (
            <>
              <header className="conversation-heading">
                <div><h2>{t.conversationHeading}</h2><p>{canContinue ? t.conversationPrivate : t.conversationReadOnly}</p></div>
                {canContinue && <button className="button quiet" type="button" onClick={() => void toggleShared()} disabled={busy !== ""}>{busy === "share" ? t.busy : active.shared ? t.unshareConversation : t.shareConversation}</button>}
              </header>
              <div className="message-list" aria-live="polite">
                {hasMore && <button className="button quiet" type="button" disabled={busy !== ""} onClick={() => void loadOlder()}>{busy === "older" ? t.busy : t.olderMessages}</button>}
                {messages.map((message) => message.role === "user" ? (
                  <article className="chat-message user-message" key={message.id}>
                    <p className="message-label">{t.you}</p><p className="user-question">{message.content}</p>
                    <p className="scope-record">{message.scope.mode === "space" ? t.scopeSpace : t.scopeDocuments(message.scope.documentIds.map((id) => names.get(id) ?? t.sourceUnavailableLabel).join(", "))}</p>
                  </article>
                ) : <AssistantAnswer key={message.id} message={message} language={language} resolvingId={resolvingId} onCitation={(citation) => void openCitation(message, citation)} />)}
                {!messages.length && !loading && <p className="empty-line">{t.chatStart}</p>}
              </div>
              {canContinue ? (
                <form className="chat-composer" onSubmit={submit}>
                  <label htmlFor="chat-question">{t.chatQuestion}</label>
                  <textarea id="chat-question" rows={3} maxLength={4096} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.chatQuestionHint} disabled={busy !== ""} />
                  <fieldset className="scope-picker" disabled={busy !== ""}>
                    <legend>{t.scopeLabel}</legend>
                    <label><input type="radio" name="scope-mode" value="space" checked={scopeMode === "space"} onChange={() => setScopeMode("space")} /> {t.scopeSpace}</label>
                    <label><input type="radio" name="scope-mode" value="documents" checked={scopeMode === "documents"} onChange={() => setScopeMode("documents")} /> {t.scopeChooseDocuments}</label>
                    {scopeMode === "documents" && (documents.length ? <div className="scope-documents">
                      {documents.map((item) => <label key={item.id}><input type="checkbox" checked={selectedDocuments.includes(item.id)} onChange={(event) => setSelectedDocuments((current) => event.target.checked ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))} /> {item.name} <small>({item.format})</small></label>)}
                    </div> : <p className="scope-empty">{t.chatNoSources}</p>)}
                    {scopeMode === "documents" && documents.length > 0 && selectedDocuments.filter((id) => names.has(id)).length === 0 && <p className="scope-empty" role="status">{t.scopeSelectAtLeastOne}</p>}
                  </fieldset>
                  {hasMore && <p className="scope-empty" role="status">{t.chatHistoryIncomplete}</p>}
                  <div className="composer-footer"><span>{t.chatQuestionLimit}</span><button className="button primary" type="submit" disabled={busy !== "" || hasMore || !question.trim() || (scopeMode === "documents" && !selectedDocuments.some((id) => names.has(id)))}>{busy === "send" ? t.chatSending : t.chatSend}</button></div>
                </form>
              ) : <p className="read-only-note" role="status">{t.conversationReadOnly}</p>}
            </>
          ) : <div className="conversation-empty"><p>{loading ? t.chatLoading : conversations.length ? t.selectConversation : t.chatEmpty}</p></div>}
        </div>

        <aside className="evidence-rail" aria-label={t.evidenceRail}>
          <div className="evidence-heading"><p className="eyebrow">{t.evidenceLabel}</p>{resolved && <button className="text-button" type="button" onClick={() => setResolved(null)}>{t.closeSource}</button>}</div>
          {!resolved ? (
            <p className="evidence-empty" role="status">{resolvingId ? t.citationLoading : t.evidenceHint}</p>
          ) : (
            <div className="citation-source">
              <h3>{resolved.citation.title}</h3>
              <p className="source-meta">{resolved.citation.provenance.kind === "note" ? t.sourceNote : t.sourceFile} · {citationLocation(resolved.citation, language)}</p>
              {resolved.citation.status === "current" && citationSource ? (
                <>
                  <p className="revision-badge current">{t.citationCurrent}</p>
                  {!usableRange && <p className="historical-warning" role="status">{t.citationNoPreciseRange}</p>}
                  <TextSourceView source={citationSource} range={usableRange} focusLine={focusLine(citationSource, resolved.citation)} />
                </>
              ) : resolved.citation.status === "current" ? (
                <p className="historical-warning" role="alert">{t.citationResolutionUnavailable}</p>
              ) : (
                <>
                  <p className={`revision-badge ${resolved.citation.status}`}>{t[`citation${resolved.citation.status[0].toUpperCase()}${resolved.citation.status.slice(1)}` as "citationReplaced" | "citationDeleted" | "citationInaccessible"]}</p>
                  <p className="eyebrow">{t.historicalExcerpt}</p>
                  <blockquote className="historical-excerpt">{resolved.citation.excerpt}</blockquote>
                  <p className="historical-warning">{t.historicalCitationNote}</p>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function AssistantAnswer({
  message,
  language,
  resolvingId,
  onCitation,
}: {
  message: AssistantMessage;
  language: Language;
  resolvingId: string;
  onCitation: (citation: Citation) => void;
}) {
  const t = copy[language];
  if (message.abstained) {
    const reason = message.reason === "budget" ? t.chatBudget
      : message.reason === "provider" ? t.chatProvider
        : message.reason === "configuration" ? t.chatConfiguration : t.chatAbstained;
    return <article className="chat-message assistant-message"><p className="message-label">{t.assistant}</p><p className="abstention">{reason}</p></article>;
  }
  const citations = new Map(message.citations.map((citation) => [citation.id, citation]));
  return (
    <article className="chat-message assistant-message">
      <p className="message-label">{t.assistant}</p>
      {message.claims.map((claim, index) => (
        <section className="answer-claim" key={`${message.id}-${index}`}>
          <p className={`claim-label ${claim.label}`}>{t[`claim${claim.label[0].toUpperCase()}${claim.label.slice(1)}` as "claimSupported" | "claimInferred" | "claimUncertain"]}</p>
          <p>{claim.text}</p>
          {claim.label === "inferred" && <div className="claim-premises"><strong>{t.inferencePremises}</strong><ul>{claim.premises.map((premise, premiseIndex) => <li key={premiseIndex}>{premise}</li>)}</ul></div>}
          <div className="claim-citations" aria-label={t.claimCitations}>
            {claim.citationIds.map((id) => {
              const citation = citations.get(id);
              return citation ? <button className="citation-button" key={id} type="button" disabled={resolvingId !== ""} onClick={() => onCitation(citation)}>{resolvingId === id ? t.citationLoading : `${t.openCitation}: ${citation.title} · ${citationLocation(citation, language)}`}</button> : null;
            })}
          </div>
        </section>
      ))}
    </article>
  );
}
