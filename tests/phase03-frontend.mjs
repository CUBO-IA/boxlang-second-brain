import assert from "node:assert/strict";

const run = process.env.P03_BROWSER_FIXTURE_RUN;
assert.match(run ?? "", /^[a-z0-9-]{1,24}$/);
const base = process.env.P03_FRONTEND_URL ?? "http://127.0.0.1:3005";
const origin = process.env.P03_ORIGIN ?? base;
const password = "phase03-browser-synthetic-password";

async function request(path, session, { method = "GET", body, raw = false, csrf = session?.csrf, requestOrigin = origin } = {}) {
  const headers = new Headers({ origin: requestOrigin });
  if (session) headers.set("cookie", `tracking=ignored; ${session.cookie}; other=ignored`);
  if (csrf) headers.set("x-csrf-token", csrf);
  if (body !== undefined) headers.set("content-type", "application/json");
  const response = await fetch(new URL(path, base), {
    method,
    headers,
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  const payload = await response.json();
  assert.doesNotMatch(JSON.stringify(payload), /\/data\/|\/modules\/|leaseToken|password_hash|POSTGRES_PASSWORD/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  return { status: response.status, body: payload, headers: response.headers };
}

async function login(role) {
  const response = await request("/api/auth/login", null, {
    method: "POST",
    body: { email: `p03-browser-${run}-${role}@example.invalid`, password },
  });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie");
  assert.match(setCookie ?? "", /^sb_session=/);
  return { cookie: setCookie.split(";")[0], csrf: response.body.csrfToken };
}

const owner = await login("owner");
const reader = await login("reader");
const spaces = (await request("/api/spaces", owner)).body.spaces;
const space = spaces.find((item) => item.name === `Phase 03 browser ${run}`);
assert.ok(space, "fixture space is visible through the proxy");
const docsPath = `/api/spaces/${space.id}/documents`;
const documents = (await request(docsPath, owner)).body.documents;
const note = documents.find((item) => item.source === "note" && item.name === "Browser evidence note");
assert.ok(note, "fixture note is visible as a note");

const sourceResult = await request(`${docsPath}/${note.id}/source`, owner);
assert.equal(sourceResult.status, 200);
assert.equal(sourceResult.body.source.kind, "note");
assert.equal(sourceResult.body.source.revisionId, note.version);
assert.ok(sourceResult.body.source.lines.length > 0);
assert.equal((await request(`${docsPath}/${note.id}/source`)).status, 401);
assert.equal((await request(`${docsPath}/not-a-uuid/source`, owner)).status, 404);
assert.equal((await request(`${docsPath}/${note.id}/source`, owner, { method: "POST", body: {} })).status, 405);

const list = await request(`/api/spaces/${space.id}/conversations?offset=0&limit=50`, owner);
assert.equal(list.status, 200);
const conversation = list.body.conversations.find((item) => item.shared && item.canContinue);
assert.ok(conversation, "shared author conversation is listed");
const history = await request(`/api/conversations/${conversation.id}?afterSequence=0&limit=100`, owner);
assert.equal(history.status, 200);
const answer = history.body.messages.find((message) => message.role === "assistant");
assert.ok(answer?.claims?.length && answer.citations?.length, "fixture includes validated claims and persisted citations");
assert.equal(answer.claims[0].citationIds[0], answer.citations[0].id);

const citation = await request(`/api/conversations/${conversation.id}/messages/${answer.id}/citations/${answer.citations[0].id}`, owner);
assert.equal(citation.status, 200);
assert.equal(citation.body.citation.status, "current");
assert.equal(citation.body.source.revisionId, note.version);
assert.equal(typeof citation.body.citation.location.startOffset, "number");
assert.equal(typeof citation.body.citation.location.endOffset, "number");

const readerHistory = await request(`/api/conversations/${conversation.id}`, reader);
assert.equal(readerHistory.status, 200);
assert.equal((await request(`/api/conversations/${conversation.id}/messages`, reader, {
  method: "POST",
  body: { question: "must stay read-only", scope: { mode: "space" } },
})).status, 404);

const emptySelection = await request(`/api/conversations/${conversation.id}/messages`, owner, {
  method: "POST",
  body: { question: "empty selections never widen", scope: { mode: "documents", documentIds: [] } },
});
assert.equal(emptySelection.status, 400);

const oversizedChat = await request(`/api/conversations/${conversation.id}/messages`, owner, {
  method: "POST",
  body: JSON.stringify({ question: "q".repeat(32_769), scope: { mode: "space" } }),
  raw: true,
});
assert.equal(oversizedChat.status, 413);
assert.equal(oversizedChat.body.category, "limit");

const oversizedNote = await request(`/api/spaces/${space.id}/notes`, owner, {
  method: "POST",
  body: JSON.stringify({ title: "oversized", body: "n".repeat(1_100_001), operationKey: `cap-${run}` }),
  raw: true,
});
assert.equal(oversizedNote.status, 413);
assert.equal(oversizedNote.body.category, "limit");

assert.equal((await request(`/api/spaces/${space.id}/notes`, owner, {
  method: "POST",
  body: { title: "csrf check", body: "no write", operationKey: `csrf-${run}` },
  csrf: "wrong",
})).status, 403);
assert.equal((await request(`/api/spaces/${space.id}/notes`, owner, {
  method: "POST",
  body: { title: "origin check", body: "no write", operationKey: `origin-${run}` },
  requestOrigin: "https://invalid.example",
})).status, 403);

console.log("OK: real Next → BoxLang proxy operations, cookie-only auth, no-store, strict IDs/methods, source and citation revision/offset forwarding, shared read-only permission, CSRF/Origin, empty scope, and exact 32,768/1,100,000-byte caps; no provider calls.");
