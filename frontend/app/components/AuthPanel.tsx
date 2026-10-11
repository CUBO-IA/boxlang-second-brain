"use client";

import { useState, type FormEvent } from "react";

import { apiRequest, ApiError } from "../lib/api";
import { copy } from "../lib/copy";
import type { AuthResponse, Language } from "../lib/types";

type NoticeKey = "" | "registerNotice" | "invalidCredentials" | "invalidInput" | "rateLimited" | "requestDenied" | "genericError" | "sessionExpired";

export function AuthPanel({
  language,
  notice,
  onAuthenticated,
}: {
  language: Language;
  notice: "" | "genericError" | "sessionExpired";
  onAuthenticated: (auth: AuthResponse) => void;
}) {
  const t = copy[language];
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<NoticeKey>("");
  const [isError, setIsError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const result = await apiRequest<AuthResponse | { message: string }>(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (mode === "login") {
        onAuthenticated(result as AuthResponse);
      } else {
        setMode("login");
        setPassword("");
        setMessage("registerNotice");
      }
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      setMessage(status === 401 ? "invalidCredentials"
        : status === 400 ? "invalidInput"
          : status === 429 ? "rateLimited"
            : status === 403 ? "requestDenied" : "genericError");
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setMessage("");
    setIsError(false);
  }

  return (
    <section className="auth-layout" aria-labelledby="welcome-title">
      <div className="auth-intro">
        <p className="eyebrow">{t.brand} / {t.account}</p>
        <h1 id="welcome-title">{t.welcome}</h1>
        <p>{t.authIntro}</p>
        <p className="identity-note">{t.identityWarning}</p>
      </div>
      <div className="auth-card">
        <div className="auth-tabs" role="group" aria-label={language === "es" ? "Acceso a la cuenta" : "Account access"}>
          <button type="button" className={mode === "login" ? "tab active" : "tab"} aria-pressed={mode === "login"} onClick={() => switchMode("login")}>{t.login}</button>
          <button type="button" className={mode === "register" ? "tab active" : "tab"} aria-pressed={mode === "register"} onClick={() => switchMode("register")}>{t.register}</button>
        </div>
        <form onSubmit={submit} aria-busy={busy}>
          <label htmlFor="account-email">{t.email}</label>
          <input
            id="account-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="account-password">{t.password}</label>
          <input
            id="account-password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="field-hint">{t.passwordHint}</p>
          <button className="button primary full-width" type="submit" disabled={busy}>
            {busy ? t.busy : mode === "login" ? t.submitLogin : t.submitRegister}
          </button>
        </form>
        <p className="switch-mode">
          <button type="button" className="text-button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? t.switchRegister : t.switchLogin}
          </button>
        </p>
        <p className="notice" role={message || notice ? (isError ? "alert" : "status") : undefined} aria-live="polite">
          {message ? t[message] : notice ? t[notice] : ""}
        </p>
      </div>
    </section>
  );
}
