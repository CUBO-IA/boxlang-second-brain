// Real Next.js -> BoxLang -> PostgreSQL/private volume. Run after phase02-http.mjs (before).
import assert from "node:assert/strict";

const run = process.env.P02_RUN;
assert.match(run ?? "", /^[a-z0-9-]{1,40}$/);
const base = process.env.P02_FRONTEND_URL ?? "http://127.0.0.1:3000";
const origin = process.env.P02_ORIGIN ?? "http://127.0.0.1:3004";
async function request(path, session, { method = "GET", body, csrf = session?.csrf } = {}) {
  const headers = new Headers({ origin });
  if (session) headers.set("cookie", session.cookie);
  if (csrf) headers.set("x-csrf-token", csrf);
  if (body && !(body instanceof FormData)) headers.set("content-type", "application/json");
  const response = await fetch(new URL(path, base), { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  if (path.endsWith("/original") && response.ok) return { status: response.status, text: await response.text(), headers: response.headers };
  const payload = await response.json();
  assert.doesNotMatch(JSON.stringify(payload), /\/data\/|\/modules\/|leaseToken|password_hash|POSTGRES_PASSWORD/);
  return { status: response.status, body: payload, headers: response.headers };
}
async function login(role) {
  const response = await request("/api/auth/login", null, { method: "POST", body: { email: `p02-${run}-${role}@example.invalid`, password: "phase02-synthetic-password" } });
  assert.equal(response.status, 200);
  return { cookie: response.headers.get("set-cookie").split(";")[0], csrf: response.body.csrfToken };
}
const admin = await login("admin");
const reader = await login("reader");
const outsider = await login("outsider");
const spaces = (await request("/api/spaces", admin)).body.spaces;
const spaceId = spaces.find((space) => space.name === `P02 HTTP ${run}`).id;
const docs = `/api/spaces/${spaceId}/documents`;
function form(files) {
  const data = new FormData();
  data.set("count", String(files.length));
  files.forEach(([name, content], index) => {
    data.set(`name${index + 1}`, name);
    data.set(`key${index + 1}`, `web-${index}-${run}-${crypto.randomUUID()}`);
    data.set(`file${index + 1}`, new Blob([content]), name);
  });
  return data;
}
const upload = (session, files, options = {}) => request(docs, session, { method: "POST", body: form(files), ...options });
const uploaded = await upload(admin, [["web.txt", `Web integration ${run}`], ["bad.exe", "synthetic"], ["../escape.txt", "synthetic"]]);
assert.equal(uploaded.status, 200);
assert.deepEqual(uploaded.body.results.map((result) => result.status), [202, 415, 400]);
assert.equal(uploaded.body.results[1].error.category, "format");
const stored = uploaded.body.results[0].document;
try {
  const listed = await request(docs, admin);
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body.limits, { maxFileBytes: 50_000_000, maxDocuments: 1000, maxFilesPerUpload: 20 });
  const document = listed.body.documents.find((item) => item.id === stored.documentId);
  assert.match(document.id, /^[a-f0-9-]{36}$/);
  assert.equal(document.source, "file");
  assert.equal(document.format, "txt");
  assert.equal(document.sizeBytes, Buffer.byteLength(`Web integration ${run}`));
  assert.equal(document.status, "pending");
  assert.equal(document.failure, null);
  assert.equal(document.replacement, null);
  assert.ok(!Number.isNaN(Date.parse(document.updatedAt)));
  assert.equal(document.attempt.taskId, stored.taskId);
  const original = await request(`${docs}/${document.id}/original`, reader);
  assert.equal(original.status, 200);
  assert.equal(original.text, `Web integration ${run}`);
  assert.match(original.headers.get("content-disposition"), /^attachment/);
  assert.equal(original.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await request(docs, outsider)).status, 403);
  assert.equal((await request(docs)).status, 401);
  assert.equal((await upload(reader, [["reader.txt", "synthetic"]])).status, 403);
  assert.equal((await upload(admin, [["csrf.txt", "synthetic"]], { csrf: "wrong" })).status, 403);
  assert.equal((await request(`${docs}/${document.id}`, reader, { method: "DELETE", body: {} })).status, 403);
  const retry = `/api/spaces/${spaceId}/tasks/${document.attempt.taskId}/retry`;
  assert.equal((await request(retry, reader, { method: "POST", body: {} })).status, 403);
  assert.equal((await request(retry, admin, { method: "POST", body: {} })).status, 409);
  const replaced = await request(`${docs}/${document.id}/content`, admin, { method: "POST", body: form([["web-v2.txt", `Web replacement ${run}`]]) });
  assert.equal(replaced.status, 200);
  assert.equal(replaced.body.results[0].status, 202);
  assert.equal((await request(`${docs}/${document.id}/original`, admin)).text, `Web replacement ${run}`);
  assert.equal((await request(`${docs}/${document.id}`, admin, { method: "DELETE", body: {} })).body.status, "deleted");
  assert.equal((await request(`${docs}/${document.id}/original`, admin)).status, 404);
  console.log("OK P02 real web integration: UUID routes, multipart, per-file categories, document UI shape, private download, roles, CSRF, task retry, replacement and deletion. No AI.");
} finally {
  await request(`${docs}/${stored.documentId}`, admin, { method: "DELETE", body: {} });
}
