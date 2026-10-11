"use client";

import { useState, type FormEvent } from "react";

import { ApiError } from "../lib/api";
import { copy } from "../lib/copy";
import type { Language, Member, Space } from "../lib/types";
import { MemberManager } from "./MemberManager";

type NoticeKey = "" | "spaceCreated" | "sessionExpired" | "rateLimited" | "genericError";

export function WorkspacePanel({
  language,
  spaces,
  activeSpace,
  members,
  onSelect,
  onCreate,
  onRefresh,
  onAddMember,
  onChangeRole,
  onRemoveMember,
}: {
  language: Language;
  spaces: Space[];
  activeSpace: Space | null;
  members: Member[];
  onSelect: (id: number) => void;
  onCreate: (name: string) => Promise<void>;
  onRefresh: () => void;
  onAddMember: (email: string, role: Member["role"]) => Promise<void>;
  onChangeRole: (member: Member, role: Member["role"]) => Promise<void>;
  onRemoveMember: (member: Member) => Promise<void>;
}) {
  const t = copy[language];
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<NoticeKey>("");
  const [isError, setIsError] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      await onCreate(name);
      setName("");
      setMessage("spaceCreated");
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      setMessage(status === 401 ? "sessionExpired" : status === 429 ? "rateLimited" : "genericError");
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  const roleName = activeSpace?.role === "admin" ? t.roleAdmin : activeSpace?.role === "editor" ? t.roleEditor : t.roleReader;

  return (
    <div className="workspace-layout">
      <aside className="space-rail" aria-label={t.spaces}>
        <div className="rail-heading">
          <p className="eyebrow">{t.spaces}</p>
          <span className="space-count">{spaces.length.toString().padStart(2, "0")}</span>
        </div>
        {spaces.length ? (
          <nav className="space-list" aria-label={t.selectSpace}>
            {spaces.map((space) => (
              <button
                key={space.id}
                type="button"
                className={space.id === activeSpace?.id ? "space-option selected" : "space-option"}
                aria-current={space.id === activeSpace?.id ? "page" : undefined}
                onClick={() => onSelect(space.id)}
              >
                <span className="space-mark" aria-hidden="true">{space.name.slice(0, 1).toUpperCase()}</span>
                <span className="space-option-label">{space.name}</span>
                <span className="space-role">{space.role === "admin" ? t.roleAdminShort : space.role === "editor" ? t.roleEditorShort : t.roleReaderShort}</span>
              </button>
            ))}
          </nav>
        ) : <p className="empty-line rail-empty">{t.emptySpaces}</p>}
        <form className="create-space-form" onSubmit={create} aria-busy={busy}>
          <label htmlFor="space-name">{t.spaceName}</label>
          <input id="space-name" type="text" maxLength={100} required value={name} onChange={(event) => setName(event.target.value)} />
          <button className="button secondary full-width" type="submit" disabled={busy}>{busy ? t.creating : t.createSpace}</button>
          <p className="notice" role={message ? (isError ? "alert" : "status") : undefined} aria-live="polite">{message ? t[message] : ""}</p>
        </form>
      </aside>

      <section className="workspace-main" aria-labelledby="active-space-title">
        {activeSpace ? (
          <>
            <header className="space-header">
              <div>
                <p className="eyebrow">{t.activeSpace} / {roleName}</p>
                <h1 id="active-space-title">{activeSpace.name}</h1>
              </div>
              <button className="button quiet" type="button" onClick={onRefresh}>{t.refresh}</button>
            </header>
            <div className="workspace-placeholder">
              <span className="placeholder-symbol" aria-hidden="true">∴</span>
              <div>
                <h2>{activeSpace.name}</h2>
                <p>{t.emptyProtected}</p>
              </div>
            </div>
            {activeSpace.role === "admin" && (
              <MemberManager
                language={language}
                members={members}
                onAdd={onAddMember}
                onRole={onChangeRole}
                onRemove={onRemoveMember}
              />
            )}
          </>
        ) : (
          <div className="space-empty-state">
            <p className="eyebrow">{t.activeSpace}</p>
            <h1 id="active-space-title">{t.selectSpace}</h1>
            <p>{t.emptySpaces}</p>
          </div>
        )}
      </section>
    </div>
  );
}
