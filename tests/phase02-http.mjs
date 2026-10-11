// P02.1–P02.3 / V03,V05,V06,V16,V18. Real BoxLang HTTP; no AI or frontend implementation.
import assert from "node:assert/strict";

const run = process.env.P02_RUN;
assert.match(run ?? "", /^[a-z0-9-]{1,40}$/);
const mode = process.env.P02_MODE ?? "before";
const base = process.env.BOXLANG_URL ?? "http://boxlang:8080";
const origin = process.env.P02_ORIGIN ?? "http://127.0.0.1:3000";
const email = (role) => `p02-${run}-${role}@example.invalid`;
const password = "phase02-synthetic-password";

async function call(api, op, session, { method = "GET", body, form, spaceId, documentId, taskId, memberId, csrf = session?.csrf, requestOrigin = origin } = {}) {
  const url = new URL(`/api/${api}.bxm`, base);
  for (const [key, value] of Object.entries({ op, spaceId, documentId, taskId, memberId })) if (value !== undefined) url.searchParams.set(key, String(value));
  const headers = new Headers({ origin: requestOrigin });
  if (session) headers.set("cookie", session.cookie);
  if (csrf) headers.set("x-csrf-token", csrf);
  if (body) headers.set("content-type", "application/json");
  const response = await fetch(url, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  if (op === "original" && response.ok) return { status: response.status, bytes: Buffer.from(await response.arrayBuffer()), headers: response.headers };
  const text = await response.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { assert.fail(`Expected safe JSON; HTTP ${response.status}: ${text.slice(0, 200)}`); }
  assert.doesNotMatch(text, /\/data\/|\/modules\/|password_hash|java\.lang|POSTGRES_PASSWORD/i);
  return { status: response.status, body: parsed, headers: response.headers };
}
const account = (op, session, options) => call("account", op, session, options);
const library = (op, session, options) => call("library", op, session, options);

async function login(role) {
  const response = await account("login", null, { method: "POST", body: { email: email(role), password } });
  assert.equal(response.status, 200);
  return { cookie: response.headers.get("set-cookie").split(";")[0], csrf: response.body.csrfToken, id: response.body.user.id };
}
function uploadForm(files, count = files.length) {
  const form = new FormData();
  form.set("count", String(count));
  files.forEach(({ name = "input.txt", content = `Synthetic ${run}`, key, filename = name }, i) => {
    form.set(`name${i + 1}`, name);
    form.set(`key${i + 1}`, key);
    form.set(`file${i + 1}`, new Blob([content]), filename);
  });
  return form;
}
async function upload(session, spaceId, files, extra = {}) {
  return library("upload", session, { method: "POST", spaceId, form: uploadForm(files), ...extra });
}
const getSpace = async (session, name) => {
  const spaces = await account("spaces", session);
  const space = spaces.body.spaces.find((s) => s.name === name);
  assert.ok(space, `Expected synthetic space ${name}`);
  return String(space.id);
};

if (mode === "before") {
  for (const role of ["admin", "editor", "reader", "outsider"]) assert.equal((await account("register", null, { method: "POST", body: { email: email(role), password } })).status, 202);
}
const admin = await login("admin");
const editor = await login("editor");
const reader = await login("reader");
const outsider = await login("outsider");

if (mode === "before") {
  const created = await account("createSpace", admin, { method: "POST", body: { name: `P02 HTTP ${run}` } });
  assert.equal(created.status, 201);
  const spaceId = String(created.body.space.id);
  for (const [role, session] of [["editor", editor], ["reader", reader]]) assert.equal((await account("addMember", admin, { method: "POST", spaceId, body: { email: email(role), role } })).status, 200);
  const foreign = await account("createSpace", outsider, { method: "POST", body: { name: `P02 foreign ${run}` } });
  const foreignSpace = String(foreign.body.space.id);
  assert.equal((await account("createSpace", admin, { method: "POST", body: { name: `P02 quota ${run}` } })).status, 201);

  const mixed = await upload(admin, spaceId, [
    { name: "persist.txt", content: `Persist after restart ${run}`, key: "persist" },
    { name: "unsupported.exe", content: "not executable", key: "invalid" },
    { name: "../escape.bxs", filename: "../../escape.bxs", content: "throw(message='must never execute')", key: "malicious" },
  ]);
  assert.equal(mixed.status, 200);
  assert.deepEqual(mixed.body.results.map((r) => r.status), [202, 415, 400]);
  const first = mixed.body.results[0].document;
  assert.equal(first.status, "pending");
  const replay = await upload(admin, spaceId, [{ name: "persist.txt", content: `Persist after restart ${run}`, key: "persist" }]);
  assert.equal(replay.body.results[0].status, 200);
  assert.equal(replay.body.results[0].document.taskId, first.taskId);
  assert.equal((await upload(admin, spaceId, [{ content: "different", key: "persist", name: "persist.txt" }])).body.results[0].error.errorCategory, "operation_conflict");
  assert.equal((await upload(admin, spaceId, [{ content: `Persist after restart ${run}`, key: "duplicate", name: "another.txt" }])).body.results[0].error.errorCategory, "duplicate");
  assert.equal((await library("upload", admin, { method: "POST", spaceId, form: uploadForm([], 21) })).status, 400);
  const extraFile = uploadForm([{ key: "unexpected" }], 1);
  extraFile.set("file21", new Blob(["unexpected"]), "extra.txt");
  assert.equal((await library("upload", admin, { method: "POST", spaceId, form: extraFile })).status, 400);
  const unknownFile = uploadForm([{ key: "unexpected" }], 1);
  unknownFile.set("surprise", new Blob(["must not be silently ignored"]), "extra.txt");
  assert.equal((await library("upload", admin, { method: "POST", spaceId, form: unknownFile })).status, 400);
  const repeatedFile = uploadForm([{ key: "unexpected" }], 1);
  repeatedFile.append("file1", new Blob(["second file in the same field"]), "extra.txt");
  assert.equal((await library("upload", admin, { method: "POST", spaceId, form: repeatedFile })).status, 400);
  assert.equal((await upload(null, spaceId, [{ key: "anon" }])).status, 401);
  assert.equal((await upload(reader, spaceId, [{ key: "reader" }])).status, 403);
  assert.equal((await upload(editor, spaceId, [{ key: "csrf" }], { csrf: "wrong" })).status, 403);
  assert.equal((await upload(editor, spaceId, [{ key: "origin" }], { requestOrigin: "https://evil.invalid" })).status, 403);

  for (const session of [admin, editor, reader]) {
    const original = await library("original", session, { spaceId, documentId: first.documentId });
    assert.equal(original.status, 200);
    assert.equal(original.bytes.toString(), `Persist after restart ${run}`);
    assert.match(original.headers.get("content-disposition"), /attachment/);
    assert.equal(original.headers.get("x-content-type-options"), "nosniff");
    const task = await library("task", session, { spaceId, taskId: first.taskId });
    assert.equal(task.status, 200);
    assert.equal(task.body.task.state, "pending");
  }
  for (const op of ["documents", "original", "task"]) assert.equal((await library(op, outsider, { spaceId, documentId: first.documentId, taskId: first.taskId })).status, 403);
  assert.equal((await library("original", outsider, { spaceId: foreignSpace, documentId: first.documentId })).status, 404);
  assert.equal((await library("task", outsider, { spaceId: foreignSpace, taskId: first.taskId })).status, 404);
  assert.equal((await library("retry", reader, { method: "POST", spaceId, taskId: first.taskId })).status, 403);
  assert.equal((await library("delete", reader, { method: "DELETE", spaceId, documentId: first.documentId })).status, 403);
  assert.equal((await library("retry", editor, { method: "POST", spaceId, taskId: first.taskId })).status, 409);
  for (const op of ["claim", "publish", "recover"]) assert.equal((await library(op, admin, { method: "POST", spaceId, taskId: first.taskId })).status, 404);

  const concurrent = await Promise.all(["a", "b"].map((suffix) => upload(editor, spaceId, [{ name: "concurrent.txt", content: `Same content ${run}`, key: `concurrent-${suffix}` }])));
  assert.deepEqual(concurrent.map((r) => r.body.results[0].status).sort(), [202, 409]);
  const listed = await library("documents", admin, { spaceId });
  assert.equal(listed.status, 200);
  assert.equal(listed.body.documents.length, 2);
  assert.ok(listed.body.documents.every((d) => d.status === "pending"));
  assert.equal((await account("removeMember", admin, { method: "DELETE", spaceId, memberId: reader.id })).status, 200);
  assert.equal((await library("original", reader, { spaceId, documentId: first.documentId })).status, 403);
  assert.equal((await library("task", reader, { spaceId, taskId: first.taskId })).status, 403);
  assert.equal((await account("addMember", admin, { method: "POST", spaceId, body: { email: email("reader"), role: "reader" } })).status, 200);

  // Actual multipart >50 MB, not only a client-reported size.
  const oversized = new Uint8Array(50_000_001);
  oversized.set(new TextEncoder().encode("%PDF-1.7"));
  const tooLarge = await upload(admin, spaceId, [{ name: "too-large.pdf", content: oversized, key: "too-large" }]);
  assert.equal(tooLarge.body.results[0].status, 413);
  assert.equal((await library("documents", admin, { spaceId })).body.documents.length, 2);
  console.log(`OK P02.1–P02.3 / V03,V05,V06,V16,V18: HTTP batch, private originals/tasks, roles, revocation, CSRF, retries/duplicates, simultaneous duplicates, >50 MB. Restart fixture retained: ${run}`);
} else if (mode === "quota") {
  const spaceId = await getSpace(admin, `P02 quota ${run}`);
  const results = await Promise.all(["a", "b"].map((suffix) => upload(admin, spaceId, [{ name: `quota-${suffix}.txt`, content: `quota ${run} ${suffix}`, key: `quota-${suffix}` }])));
  assert.deepEqual(results.map((r) => r.body.results[0].status).sort(), [202, 409]);
  assert.equal(results.flatMap((r) => r.body.results).find((r) => r.status === 409).error.errorCategory, "document_quota");
  console.log("OK P02.2 / V18: concurrent uploads at 999 documents accept exactly one; DB audit must verify 1,000.");
} else if (mode === "after") {
  const spaceId = await getSpace(admin, `P02 HTTP ${run}`);
  const list = await library("documents", admin, { spaceId });
  assert.equal(list.body.documents.length, 2);
  const first = list.body.documents.find((d) => d.name === "persist.txt");
  assert.ok(first);
  assert.equal(first.status, "pending");
  const resumed = await library("task", reader, { spaceId, taskId: first.attempt.taskId });
  assert.equal(resumed.body.task.state, "pending");
  assert.equal(resumed.body.task.attempts, 1);
  assert.equal(resumed.body.task.errorCategory, "interrupted");
  const persisted = await library("original", reader, { spaceId, documentId: first.id });
  assert.equal(persisted.bytes.toString(), `Persist after restart ${run}`);
  assert.equal((await library("original", outsider, { spaceId, documentId: first.id })).status, 403);
  for (const doc of list.body.documents) assert.equal((await library("delete", editor, { method: "DELETE", spaceId, documentId: doc.id })).body.status, "deleted");
  assert.equal((await library("original", admin, { spaceId, documentId: first.id })).status, 404);
  assert.equal((await library("documents", admin, { spaceId })).body.documents.length, 0);
  console.log("OK P02.1,P02.4,P02.5 / V03,V06,V08: original reconciled and expired processing task recovered on real BoxLang restart; authorized download, outsider denial and deletion verified.");
} else assert.fail(`Unknown mode ${mode}`);
