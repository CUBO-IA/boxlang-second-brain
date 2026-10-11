"use client";

import { useState } from "react";

import { ApiError } from "../lib/api";
import { copy } from "../lib/copy";
import type { Language, Member } from "../lib/types";

type Role = Member["role"];
type NoticeKey = "" | "processMember" | "roleUpdated" | "memberRemoved" | "sessionExpired" | "forbidden" | "notFound" | "lastAdmin" | "rateLimited" | "genericError";

export function MemberManager({
  language,
  members,
  onAdd,
  onRole,
  onRemove,
}: {
  language: Language;
  members: Member[];
  onAdd: (email: string, role: Role) => Promise<void>;
  onRole: (member: Member, role: Role) => Promise<void>;
  onRemove: (member: Member) => Promise<void>;
}) {
  const t = copy[language];
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("reader");
  const [busy, setBusy] = useState(false);
  const [localMessage, setLocalMessage] = useState<NoticeKey>("");
  const [isError, setIsError] = useState(false);

  function errorMessage(error: unknown): Exclude<NoticeKey, ""> {
    const status = error instanceof ApiError ? error.status : 0;
    return status === 401 ? "sessionExpired"
      : status === 403 ? "forbidden"
        : status === 404 ? "notFound"
          : status === 409 ? "lastAdmin"
            : status === 429 ? "rateLimited" : "genericError";
  }

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setLocalMessage("");
    setIsError(false);
    try {
      await onAdd(email, role);
      setEmail("");
      setLocalMessage("processMember");
    } catch (error) {
      setLocalMessage(errorMessage(error));
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  async function saveRole(member: Member, nextRole: Role) {
    if (busy || member.role === nextRole) return;
    if (member.role === "admin" && nextRole !== "admin" && !window.confirm(t.confirmDemotion)) return;
    setBusy(true);
    setLocalMessage("");
    setIsError(false);
    try {
      await onRole(member, nextRole);
      setLocalMessage("roleUpdated");
    } catch (error) {
      setLocalMessage(errorMessage(error));
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(member: Member) {
    if (busy || !window.confirm(t.confirmRemove)) return;
    setBusy(true);
    setLocalMessage("");
    setIsError(false);
    try {
      await onRemove(member);
      setLocalMessage("memberRemoved");
    } catch (error) {
      setLocalMessage(errorMessage(error));
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="member-card" aria-labelledby="member-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.account}</p>
          <h2 id="member-title">{t.memberTitle}</h2>
        </div>
        <span className="member-count">{members.length}</span>
      </div>
      <p className="section-note">{t.memberIntro}</p>
      <form className="member-form" onSubmit={add} aria-busy={busy}>
        <div className="form-field">
          <label htmlFor="member-email">{t.memberEmail}</label>
          <input id="member-email" type="email" autoComplete="off" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="new-member-role">{t.memberRole}</label>
          <select id="new-member-role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <RoleOptions language={language} />
          </select>
        </div>
        <button className="button primary" type="submit" disabled={busy}>{busy ? t.busy : t.addMember}</button>
      </form>
      <p className="section-note invite-note">{t.noEmail}</p>
      <div className="member-list" aria-label={t.memberTitle}>
        {members.length === 0 ? <p className="empty-line">{t.memberEmpty}</p> : members.map((member) => (
          <div className="member-row" key={member.id}>
            <div className="member-identity">
              <span className="avatar" aria-hidden="true">{member.email.slice(0, 1).toUpperCase()}</span>
              <span className="member-email">{member.email}</span>
            </div>
            <label className="sr-only" htmlFor={`member-role-${member.id}`}>{t.memberRoleFor(member.email)}</label>
            <select id={`member-role-${member.id}`} value={member.role} disabled={busy} onChange={(event) => void saveRole(member, event.target.value as Role)}>
              <RoleOptions language={language} />
            </select>
            <button className="button quiet destructive" type="button" disabled={busy} onClick={() => void remove(member)}>{t.removeMember}</button>
          </div>
        ))}
      </div>
      <p className="notice" role={localMessage ? (isError ? "alert" : "status") : undefined} aria-live="polite">
        {localMessage ? t[localMessage] : ""}
      </p>
    </section>
  );
}

function RoleOptions({ language }: { language: Language }) {
  const t = copy[language];
  return <>
    <option value="admin">{t.roleAdmin}</option>
    <option value="editor">{t.roleEditor}</option>
    <option value="reader">{t.roleReader}</option>
  </>;
}
