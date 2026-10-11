"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";

import { ApiError } from "../lib/api";
import { copy } from "../lib/copy";
import type { Language, Member, Space } from "../lib/types";
import { LogoMark } from "./Brand";
import { LibraryPanel } from "./LibraryPanel";
import { MemberManager } from "./MemberManager";

type NoticeKey = "" | "spaceCreated" | "sessionExpired" | "rateLimited" | "genericError";
type View = "library" | "members";

export function WorkspacePanel({
  language,
  spaces,
  activeSpace,
  members,
  csrfToken,
  notice,
  headerActions,
  sidebarFooter,
  onSelect,
  onCreate,
  onRefresh,
  onAddMember,
  onChangeRole,
  onRemoveMember,
  onSessionExpired,
  onLibraryForbidden,
}: {
  language: Language;
  spaces: Space[];
  activeSpace: Space | null;
  members: Member[];
  csrfToken: string;
  notice: string;
  headerActions: ReactNode;
  sidebarFooter: ReactNode;
  onSelect: (id: number) => void;
  onCreate: (name: string) => Promise<void>;
  onRefresh: () => void;
  onAddMember: (email: string, role: Member["role"]) => Promise<void>;
  onChangeRole: (member: Member, role: Member["role"]) => Promise<void>;
  onRemoveMember: (member: Member) => Promise<void>;
  onSessionExpired: () => void;
  onLibraryForbidden: () => void;
}) {
  const t = copy[language];
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<NoticeKey>("");
  const [isError, setIsError] = useState(false);
  const [requestedView, setRequestedView] = useState<View>("library");

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

  const isAdmin = activeSpace?.role === "admin";
  const view: View = isAdmin && requestedView === "members" ? "members" : "library";
  const roleName = isAdmin ? t.roleAdmin : activeSpace?.role === "editor" ? t.roleEditor : t.roleReader;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="sidebar-brand" href="/">
          <LogoMark />
          <span><strong>{t.brand}</strong><small>{t.tagline}</small></span>
        </Link>

        <div className="sidebar-section" aria-label={t.spaces}>
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
        </div>

        {activeSpace && (
          <nav className="sidebar-nav" aria-label={t.navLabel}>
            <button type="button" className={view === "library" ? "nav-item active" : "nav-item"} aria-current={view === "library" ? "page" : undefined} onClick={() => setRequestedView("library")}>
              <NavIcon><path d="M4 5h6v14H4zM14 5h6v14h-6z" /></NavIcon>{t.navLibrary}
            </button>
            {isAdmin && (
              <button type="button" className={view === "members" ? "nav-item active" : "nav-item"} aria-current={view === "members" ? "page" : undefined} onClick={() => setRequestedView("members")}>
                <NavIcon><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.3c2 .8 3.5 2.8 3.5 5.7" /></NavIcon>{t.navMembers}
              </button>
            )}
            <span className="nav-item unavailable">
              <NavIcon><path d="M4 5h16v11H9l-5 4z" /></NavIcon>{t.navChat}<small>{t.comingSoon}</small>
            </span>
            <span className="nav-item unavailable">
              <NavIcon><circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="9" r="2.5" /><circle cx="11" cy="18" r="2.5" /><path d="M8.3 7.6l7.3 1M7.2 9.2l2.8 6.6M16.6 11l-4.2 5.2" /></NavIcon>{t.navGraph}<small>{t.comingSoon}</small>
            </span>
          </nav>
        )}

        <div className="sidebar-footer">{sidebarFooter}</div>
      </aside>

      <section className="app-content" aria-labelledby="active-space-title">
        {activeSpace ? (
          <>
            <header className="content-header">
              <div>
                <p className="eyebrow">{activeSpace.name} / {roleName}</p>
                <h1 id="active-space-title">{view === "members" ? t.memberTitle : t.navLibrary}</h1>
                <p className="content-subtitle">{view === "members" ? t.memberIntro : t.librarySubtitle(activeSpace.name)}</p>
              </div>
              <div className="content-actions">
                {headerActions}
                <button className="button quiet" type="button" onClick={onRefresh}>{t.refresh}</button>
              </div>
            </header>
            {notice && <p className="global-notice" role="status" aria-live="polite">{notice}</p>}
            {view === "members" ? (
              <MemberManager
                language={language}
                members={members}
                onAdd={onAddMember}
                onRole={onChangeRole}
                onRemove={onRemoveMember}
              />
            ) : (
              <LibraryPanel
                key={activeSpace.id}
                language={language}
                space={activeSpace}
                csrfToken={csrfToken}
                onSessionExpired={onSessionExpired}
                onForbidden={onLibraryForbidden}
              />
            )}
          </>
        ) : (
          <>
            <header className="content-header">
              <div>
                <p className="eyebrow">{t.activeSpace}</p>
                <h1 id="active-space-title">{t.selectSpace}</h1>
                <p className="content-subtitle">{t.emptySpaces}</p>
              </div>
              <div className="content-actions">{headerActions}</div>
            </header>
            {notice && <p className="global-notice" role="status" aria-live="polite">{notice}</p>}
          </>
        )}
      </section>
    </div>
  );
}

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
