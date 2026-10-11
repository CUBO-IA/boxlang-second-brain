"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { apiRequest, ApiError } from "../lib/api";
import { copy } from "../lib/copy";
import { useLanguage } from "../lib/language";
import type { AuthResponse, Member, Space, User } from "../lib/types";
import { AuthPanel } from "./AuthPanel";
import { LanguageSwitch, LogoMark } from "./Brand";
import { WorkspacePanel } from "./WorkspacePanel";

type AuthNoticeKey = "" | "genericError" | "sessionExpired";
type GlobalNoticeKey = "" | "genericError" | "membershipRemoved" | "forbidden" | "processMember" | "roleUpdated" | "memberRemoved" | "requestDenied" | "libraryForbidden";

export function SecondBrainApp({ backendReady }: { backendReady: boolean }) {
  const [language, setLanguage] = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [authNotice, setAuthNotice] = useState<AuthNoticeKey>("");
  const [globalNotice, setGlobalNotice] = useState<GlobalNoticeKey>("");
  const [authLoading, setAuthLoading] = useState(true);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const requestEpoch = useRef(0);
  const selectedSpaceRef = useRef<number | null>(null);
  const t = copy[language];

  const handleSessionExpiry = useCallback(() => {
    setUser(null);
    setCsrfToken("");
    setSpaces([]);
    setSelectedSpaceId(null);
    selectedSpaceRef.current = null;
    setActiveSpace(null);
    setMembers([]);
    setGlobalNotice("");
    requestEpoch.current++;
    setAuthNotice("sessionExpired");
  }, []);

  const handleRemovedAccess = useCallback((spaceId: number) => {
    setSpaces((current) => current.filter((space) => space.id !== spaceId));
    setSelectedSpaceId((current) => current === spaceId ? null : current);
    if (selectedSpaceRef.current === spaceId) selectedSpaceRef.current = null;
    setActiveSpace((current) => current?.id === spaceId ? null : current);
    setMembers([]);
    requestEpoch.current++;
    setGlobalNotice("membershipRemoved");
  }, []);

  const handleLibraryForbidden = useCallback(() => {
    setActiveSpace(null);
    setMembers([]);
    requestEpoch.current++;
    setRefreshVersion((version) => version + 1);
    setGlobalNotice("libraryForbidden");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    apiRequest<AuthResponse>("/api/auth/current", { signal: controller.signal })
      .then((auth) => {
        if (!active) return;
        setUser(auth.user);
        setCsrfToken(auth.csrfToken);
        setAuthNotice("");
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (!(error instanceof ApiError) || error.status !== 401) setAuthNotice("genericError");
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!user || !csrfToken) return;
    const controller = new AbortController();
    let active = true;
    apiRequest<{ spaces: Space[] }>("/api/spaces", { signal: controller.signal })
      .then(({ spaces: nextSpaces }) => {
        if (!active) return;
        setSpaces(nextSpaces);
        const current = selectedSpaceRef.current;
        const next = current !== null && nextSpaces.some((space) => space.id === current) ? current : nextSpaces[0]?.id ?? null;
        if (next !== current) {
          selectedSpaceRef.current = next;
          setSelectedSpaceId(next);
          setActiveSpace(null);
          setMembers([]);
          requestEpoch.current++;
        }
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) handleSessionExpiry();
        else setGlobalNotice("genericError");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [user, csrfToken, refreshVersion, handleSessionExpiry]);

  useEffect(() => {
    if (!user || !csrfToken || selectedSpaceId === null) return;
    const spaceId = selectedSpaceId;
    const controller = new AbortController();
    const epoch = ++requestEpoch.current;
    const stillCurrent = () => epoch === requestEpoch.current && !controller.signal.aborted;
    async function load() {
      try {
        const { space } = await apiRequest<{ space: Space }>(`/api/spaces/${spaceId}`, { signal: controller.signal });
        if (!stillCurrent()) return;
        setActiveSpace(space);
        if (space.role !== "admin") return;
        try {
          const result = await apiRequest<{ members: Member[] }>(`/api/spaces/${spaceId}/members`, { signal: controller.signal });
          if (stillCurrent()) setMembers(result.members);
        } catch (error) {
          if (!stillCurrent()) return;
          if (error instanceof ApiError && error.status === 401) {
            handleSessionExpiry();
          } else if (error instanceof ApiError && error.status === 403) {
            try {
              const latest = await apiRequest<{ space: Space }>(`/api/spaces/${spaceId}`, { signal: controller.signal });
              if (stillCurrent()) {
                setActiveSpace(latest.space);
                setGlobalNotice("forbidden");
              }
            } catch (accessError) {
              if (!stillCurrent()) return;
              if (accessError instanceof ApiError && accessError.status === 401) handleSessionExpiry();
              else if (accessError instanceof ApiError && accessError.status === 403) handleRemovedAccess(spaceId);
              else setGlobalNotice("genericError");
            }
          } else {
            setGlobalNotice("genericError");
          }
        }
      } catch (error) {
        if (!stillCurrent()) return;
        if (error instanceof ApiError && error.status === 401) handleSessionExpiry();
        else if (error instanceof ApiError && error.status === 403) handleRemovedAccess(spaceId);
        else setGlobalNotice("genericError");
      }
    }
    void load();
    return () => {
      controller.abort();
    };
  }, [user, csrfToken, selectedSpaceId, refreshVersion, handleSessionExpiry, handleRemovedAccess]);

  function acceptAuth(auth: AuthResponse) {
    setAuthNotice("");
    setGlobalNotice("");
    setSpaces([]);
    setSelectedSpaceId(null);
    selectedSpaceRef.current = null;
    setActiveSpace(null);
    setMembers([]);
    setUser(auth.user);
    setCsrfToken(auth.csrfToken);
  }

  function selectSpace(id: number) {
    setGlobalNotice("");
    setActiveSpace(null);
    setMembers([]);
    requestEpoch.current++;
    selectedSpaceRef.current = id;
    if (id === selectedSpaceId) setRefreshVersion((version) => version + 1);
    else setSelectedSpaceId(id);
  }

  function refreshAccess() {
    setActiveSpace(null);
    setMembers([]);
    setGlobalNotice("");
    requestEpoch.current++;
    setRefreshVersion((version) => version + 1);
  }

  function jsonMutation(method: string, body?: object): RequestInit {
    return {
      method,
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(body ?? {}),
    };
  }

  async function createSpace(name: string) {
    let result: { space: Space };
    try {
      result = await apiRequest<{ space: Space }>("/api/spaces", jsonMutation("POST", { name }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) handleSessionExpiry();
      throw error;
    }
    setSpaces((current) => [...current, result.space]);
    setGlobalNotice("");
    setActiveSpace(null);
    setMembers([]);
    requestEpoch.current++;
    selectedSpaceRef.current = result.space.id;
    setSelectedSpaceId(result.space.id);
  }

  async function addMember(email: string, role: Member["role"]) {
    if (!activeSpace) return;
    try {
      await apiRequest(`/api/spaces/${activeSpace.id}/members`, jsonMutation("POST", { email, role }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) handleSessionExpiry();
      else if (error instanceof ApiError && error.status === 403) {
        refreshAccess();
        setGlobalNotice("forbidden");
      }
      throw error;
    }
    setGlobalNotice("processMember");
    setActiveSpace(null);
    setMembers([]);
    requestEpoch.current++;
    setRefreshVersion((version) => version + 1);
  }

  async function changeRole(member: Member, role: Member["role"]) {
    if (!activeSpace) return;
    try {
      await apiRequest(`/api/spaces/${activeSpace.id}/members/${member.id}`, jsonMutation("PATCH", { role }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) handleSessionExpiry();
      else if (error instanceof ApiError && error.status === 403) {
        refreshAccess();
        setGlobalNotice("forbidden");
      }
      throw error;
    }
    setGlobalNotice("roleUpdated");
    setActiveSpace(null);
    setMembers([]);
    requestEpoch.current++;
    setRefreshVersion((version) => version + 1);
  }

  async function removeMember(member: Member) {
    if (!activeSpace) return;
    try {
      await apiRequest(`/api/spaces/${activeSpace.id}/members/${member.id}`, jsonMutation("DELETE"));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) handleSessionExpiry();
      else if (error instanceof ApiError && error.status === 403) {
        refreshAccess();
        setGlobalNotice("forbidden");
      }
      throw error;
    }
    setGlobalNotice("memberRemoved");
    setActiveSpace(null);
    setMembers([]);
    requestEpoch.current++;
    setRefreshVersion((version) => version + 1);
  }

  async function logout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await apiRequest("/api/auth/logout", jsonMutation("POST"));
      setUser(null);
      setCsrfToken("");
      setSpaces([]);
      setSelectedSpaceId(null);
      selectedSpaceRef.current = null;
      setActiveSpace(null);
      setMembers([]);
      requestEpoch.current++;
      setAuthNotice("");
      setGlobalNotice("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) handleSessionExpiry();
      else setGlobalNotice(error instanceof ApiError && error.status === 403 ? "requestDenied" : "genericError");
    } finally {
      setLogoutBusy(false);
    }
  }

  const backendPill = (
    <span className={backendReady ? "backend-pill ready" : "backend-pill down"} data-backend-status={backendReady ? "ok" : "error"}>
      <span className="health-dot" aria-hidden="true" />{backendReady ? t.backendReady : t.backendDown}
    </span>
  );
  const languageSwitch = <LanguageSwitch language={language} onChange={setLanguage} />;

  if (authLoading) {
    return (
      <main className="app-loading">
        <div className="loading-card" role="status">{t.busy}</div>
        {backendPill}
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <section className="auth-brand" aria-labelledby="welcome-title">
          <Link className="auth-logo" href="/">
            <LogoMark size={40} inverse />
            <span>{t.brand}</span>
          </Link>
          <div className="auth-slogan">
            <h1 id="welcome-title">{t.sloganLead} <span>{t.sloganAccent}</span></h1>
            <p>{t.authPitch}</p>
          </div>
          <ul className="auth-points">
            <li><strong>{t.pointCitationTitle}</strong><span>{t.pointCitationText}</span></li>
            <li><strong>{t.pointConflictTitle}</strong><span>{t.pointConflictText}</span></li>
            <li><strong>{t.pointFactsTitle}</strong><span>{t.pointFactsText}</span></li>
          </ul>
        </section>
        <section className="auth-side">
          <div className="auth-top">{backendPill}{languageSwitch}</div>
          <AuthPanel language={language} notice={authNotice} onAuthenticated={acceptAuth} />
          <p className="auth-footnote">{t.openaiNotice}</p>
        </section>
      </main>
    );
  }

  return (
    <WorkspacePanel
      language={language}
      spaces={spaces}
      activeSpace={activeSpace}
      members={members}
      csrfToken={csrfToken}
      notice={globalNotice ? t[globalNotice] : ""}
      headerActions={languageSwitch}
      sidebarFooter={(
        <>
          <p className="sidebar-account"><span className="eyebrow">{t.account}</span><strong>{user.email}</strong></p>
          <button className="button quiet full-width" type="button" onClick={() => void logout()} disabled={logoutBusy}>
            {logoutBusy ? t.busy : t.logout}
          </button>
          <div className="sidebar-meta">
            {backendPill}
            <Link className="quiet-link" href="/feasibility">{t.feasibility}</Link>
          </div>
        </>
      )}
      onSelect={selectSpace}
      onCreate={createSpace}
      onRefresh={refreshAccess}
      onAddMember={addMember}
      onChangeRole={changeRole}
      onRemoveMember={removeMember}
      onSessionExpired={handleSessionExpiry}
      onLibraryForbidden={handleLibraryForbidden}
    />
  );
}
