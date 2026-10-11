import assert from "node:assert/strict";
import { createHash, randomFillSync } from "node:crypto";
import http from "node:http";

// Phase 02 web transport and contract checks, run through the Next.js proxy.
// The library behind the proxy is tests/phase02-library-double.mjs (started
// with LIBRARY_DOUBLE_DEBUG=YES), so these verify only the frontend side of
// P02.1–P02.3 / V03, V05–V08. Accounts, spaces and roles are real (phase 01).

const run = process.env.P02_RUN ?? `run-${Date.now()}`;
assert.match(run, /^[a-z0-9-]{1,40}$/);
const frontend = process.env.P02_FRONTEND_URL ?? "http://127.0.0.1:3000";
const origin = process.env.P02_ORIGIN ?? "http://127.0.0.1:3003";
const double = process.env.P02_DOUBLE_URL ?? "http://127.0.0.1:9090";
const password = "phase02-synthetic-password";
const email = (role) => `p02-${run}-${role}@example.invalid`;
const uploadCap = 20 * 50_000_000 + 1_000_000;

async function readResponse(response) {
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { status: response.status, body, headers: response.headers };
}

function requestHeaders({ session, csrf, cookie, extra = {}, includeOrigin = true } = {}) {
  const headers = new Headers(extra);
  if (includeOrigin) headers.set("origin", origin);
  if (cookie ?? session) headers.set("cookie", cookie ?? `sb_session=${session.token}`);
  const token = csrf === undefined ? session?.csrf : csrf;
  if (token) headers.set("x-csrf-token", token);
  return headers;
}

async function call(path, { method = "GET", body, rawBody, contentType = "application/json", ...auth } = {}) {
  const headers = requestHeaders(auth);
  const payload = rawBody ?? (body === undefined ? undefined : JSON.stringify(body));
  if (payload !== undefined) headers.set("content-type", contentType);
  return readResponse(await fetch(new URL(path, frontend), { method, headers, body: payload }));
}

const file = (name, content = `synthetic ${name}`, type = "text/plain") => ({ name, content, type });

function form(field, files) {
  const data = new FormData();
  for (const { name, content, type } of files) data.append(field, new Blob([content], { type }), name);
  return data;
}

const docs = (spaceId) => `/api/spaces/${spaceId}/documents`;
const upload = async (spaceId, files, auth) =>
  readResponse(await fetch(new URL(docs(spaceId), frontend), { method: "POST", headers: requestHeaders(auth), body: form("files", files) }));
const replace = async (spaceId, documentId, replacement, auth) =>
  readResponse(await fetch(new URL(`${docs(spaceId)}/${documentId}/content`, frontend), {
    method: "PUT", headers: requestHeaders(auth), body: form("file", [replacement]),
  }));
const list = (spaceId, auth) => call(docs(spaceId), auth);
const retry = (spaceId, documentId, auth) => call(`${docs(spaceId)}/${documentId}/retry`, { method: "POST", body: {}, ...auth });
const remove = (spaceId, documentId, auth) => call(`${docs(spaceId)}/${documentId}`, { method: "DELETE", body: {}, ...auth });
const download = (spaceId, documentId, auth) =>
  fetch(new URL(`${docs(spaceId)}/${documentId}/original`, frontend), { headers: requestHeaders({ ...auth, csrf: "" }) });

// Sends only headers plus a few bytes, so a huge declared length is never actually transferred.
function rawUpload(path, session, headers) {
  return new Promise((resolve, reject) => {
    const target = new URL(path, frontend);
    const request = http.request(target, {
      method: "POST",
      headers: { origin, cookie: `sb_session=${session.token}`, "x-csrf-token": session.csrf, ...headers },
    }, (response) => {
      let text = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { text += chunk; });
      response.on("end", () => { request.destroy(); resolve({ status: response.statusCode, body: JSON.parse(text) }); });
    });
    request.on("error", reject);
    request.write("--x\r\n");
  });
}

async function doubleRequests(spaceId) {
  const response = await fetch(new URL("/__double/requests", double));
  assert.equal(response.status, 200, "the test double must run with LIBRARY_DOUBLE_DEBUG=YES");
  const body = await response.json();
  assert.equal(body.double, true);
  return body.requests.filter((entry) => entry.spaceId === String(spaceId));
}

async function account(role) {
  const address = email(role);
  assert.equal((await call("/api/auth/register", { method: "POST", body: { email: address, password } })).status, 202);
  const login = await call("/api/auth/login", { method: "POST", body: { email: address, password } });
  assert.equal(login.status, 200, `login for ${role}`);
  const token = (login.headers.get("set-cookie") ?? "").match(/(?:^|;\s*)sb_session=([A-Za-z0-9_-]{43})(?:;|$)/)?.[1];
  assert.ok(token, "login sets the session cookie");
  return { token, csrf: login.body.csrfToken, user: login.body.user, address };
}

async function createSpace(session, name) {
  const response = await call("/api/spaces", { method: "POST", body: { name }, session });
  assert.equal(response.status, 201);
  return response.body.space;
}

function assertDocumentShape(document) {
  assert.deepEqual(Object.keys(document).sort(), ["failure", "format", "id", "name", "replacement", "sizeBytes", "source", "status", "updatedAt"]);
  assert.equal(typeof document.id, "number");
  assert.equal(document.source, "file");
  assert.ok(["pending", "processing", "failed", "unsupported"].includes(document.status), `status ${document.status}`);
  assert.notEqual(document.status, "available");
  assert.ok(!Number.isNaN(Date.parse(document.updatedAt)));
}

function assertDenied(response, status = 403) {
  assert.equal(response.status, status);
  assert.equal(response.body.category, "permission");
  assert.equal(typeof response.body.message, "string");
  assert.equal("documents" in response.body, false);
  assert.equal("results" in response.body, false);
}

let passed = 0;
const failed = [];
async function test(label, check) {
  try {
    await check();
    passed += 1;
    console.log(`ok   ${label}`);
  } catch (error) {
    failed.push(label);
    console.log(`FAIL ${label}\n     ${String(error?.message ?? error).split("\n").join("\n     ")}`);
  }
}

console.log(`P02 frontend run: ${run}`);
console.log("NOTICE: these checks run against the TEST DOUBLE (tests/phase02-library-double.mjs). They verify only the web");
console.log("        transport and contract of the Next.js proxy, NOT the BoxLang library, storage, tasks or budget.");

// Real phase 01 accounts and roles: Ana admin, Bruno editor, Carla reader, Diana not a member.
const ana = await account("ana");
const bruno = await account("bruno");
const carla = await account("carla");
const diana = await account("diana");
const spaceA = await createSpace(ana, `P02 ${run} A`);
const spaceB = await createSpace(ana, `P02 ${run} B`);
const carlaSpace = await createSpace(carla, `P02 ${run} Carla`);
for (const [address, role] of [[bruno.address, "editor"], [carla.address, "reader"]]) {
  assert.equal((await call(`/api/spaces/${spaceA.id}/members`, { method: "POST", body: { email: address, role }, session: ana })).status, 200);
}

await test("P02.1 V05 — empty library lists no documents, with limits and budget", async () => {
  const response = await list(spaceA.id, { session: ana });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    documents: [],
    limits: { maxFileBytes: 50_000_000, maxDocuments: 1_000, maxFilesPerUpload: 20 },
    budget: { exhausted: false },
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

let single;
await test("P02.1 V05 — single upload is accepted as pending, never available", async () => {
  const response = await upload(spaceA.id, [file("informe.md", "# Informe sintético\n", "text/markdown")], { session: bruno });
  assert.equal(response.status, 200);
  assert.equal(response.body.results.length, 1);
  const [result] = response.body.results;
  assert.equal(result.name, "informe.md");
  assert.equal(result.accepted, true);
  assertDocumentShape(result.document);
  assert.equal(result.document.status, "pending");
  assert.equal(result.document.format, "md");
  assert.equal(result.document.sizeBytes, Buffer.byteLength("# Informe sintético\n"));
  assert.equal(result.document.failure, null);
  assert.equal(result.document.replacement, null);
  single = result.document;
});

await test("P02.3 V05 — mixed batch returns one result per file, in order", async () => {
  const names = ["valido.txt", "unsupported-imagen.png", "reject-limit.pdf", "../../etc/passwd", "sub\\dir.txt", "pagina.html"];
  const response = await upload(spaceA.id, names.map((name) => file(name)), { session: ana });
  assert.equal(response.status, 200);
  const { results } = response.body;
  assert.deepEqual(results.map(({ name }) => name), names);
  assert.deepEqual(results.map(({ accepted }) => accepted), [true, true, false, false, false, true]);
  assert.equal(results[0].document.status, "pending");
  assert.equal(results[1].document.status, "unsupported");
  assert.deepEqual(results[1].document.failure, { category: "format", retryable: false });
  assert.deepEqual(results[2], { name: names[2], accepted: false, category: "limit" });
  assert.deepEqual(results[3], { name: names[3], accepted: false, category: "format" });
  assert.deepEqual(results[4], { name: names[4], accepted: false, category: "format" });
  assert.equal(results[5].document.status, "unsupported");
  for (const result of results) if (result.accepted) assertDocumentShape(result.document);
  const listed = (await list(spaceA.id, { session: ana })).body.documents.map(({ name }) => name);
  assert.deepEqual(listed, ["informe.md", "valido.txt", "unsupported-imagen.png", "pagina.html"]);
});

await test("P02.2 V05 — more than 20 files in one operation is refused as a limit", async () => {
  const before = (await list(spaceA.id, { session: ana })).body.documents.length;
  const response = await upload(spaceA.id, Array.from({ length: 21 }, (_, index) => file(`lote-${index}.txt`)), { session: ana });
  assert.equal(response.status, 413);
  assert.equal(response.body.category, "limit");
  assert.equal((await list(spaceA.id, { session: ana })).body.documents.length, before);
});

await test("V06 — pending moves to processing and a saved file is never available", async () => {
  await new Promise((resolve) => setTimeout(resolve, 2_300));
  const { documents } = (await list(spaceA.id, { session: ana })).body;
  assert.equal(documents.find(({ id }) => id === single.id).status, "processing");
  for (const document of documents) assertDocumentShape(document);
});

await test("V03 — a reader lists and downloads but cannot upload, replace, retry or delete", async () => {
  const listed = await list(spaceA.id, { session: carla });
  assert.equal(listed.status, 200);
  assert.ok(listed.body.documents.some(({ id }) => id === single.id));
  assertDenied(await upload(spaceA.id, [file("lector.txt")], { session: carla }));
  assertDenied(await replace(spaceA.id, single.id, file("lector.md"), { session: carla }));
  assertDenied(await retry(spaceA.id, single.id, { session: carla }));
  assertDenied(await remove(spaceA.id, single.id, { session: carla }));
  const after = (await list(spaceA.id, { session: ana })).body.documents;
  assert.equal(after.some(({ name }) => name.startsWith("lector")), false);
  assert.equal(after.find(({ id }) => id === single.id).replacement, null);
  const original = await download(spaceA.id, single.id, { session: carla });
  assert.equal(original.status, 200);
  assert.equal(await original.text(), "# Informe sintético\n");
});

await test("V03 — a non-member is refused everywhere and never sees documents", async () => {
  for (const response of [
    await list(spaceA.id, { session: diana }),
    await upload(spaceA.id, [file("ajeno.txt")], { session: diana }),
    await replace(spaceA.id, single.id, file("ajeno.md"), { session: diana }),
    await retry(spaceA.id, single.id, { session: diana }),
    await remove(spaceA.id, single.id, { session: diana }),
  ]) {
    assert.ok([403, 404].includes(response.status), `status ${response.status}`);
    assert.doesNotMatch(JSON.stringify(response.body), /informe|documents|results/);
  }
  const original = await download(spaceA.id, single.id, { session: diana });
  assert.ok([403, 404].includes(original.status));
  assert.doesNotMatch(await original.text(), /Informe sintético/);
  assert.equal((await list(spaceA.id, { session: ana })).body.documents.some(({ name }) => name.startsWith("ajeno")), false);
});

await test("V03 — unauthenticated calls get 401 without content", async () => {
  assertDenied(await list(spaceA.id), 401);
  assertDenied(await upload(spaceA.id, [file("anonimo.txt")], {}), 401);
  assertDenied(await remove(spaceA.id, single.id, {}), 401);
  const original = await download(spaceA.id, single.id, {});
  assert.equal(original.status, 401);
  assert.match(original.headers.get("content-type"), /application\/json/);
  assert.equal((await original.json()).category, "permission");
});

await test("V03 — documents of space A do not exist in other spaces, even by known id", async () => {
  assert.deepEqual((await list(spaceB.id, { session: ana })).body.documents, []);
  assert.equal((await download(spaceB.id, single.id, { session: ana })).status, 404);
  assert.equal((await retry(spaceB.id, single.id, { session: ana })).status, 404);
  // Carla only reads space A; being admin of her own space must not reach A's document.
  assert.equal((await remove(carlaSpace.id, single.id, { session: carla })).status, 404);
  assert.equal((await replace(carlaSpace.id, single.id, file("cruce.md"), { session: carla })).status, 404);
  assert.equal((await download(carlaSpace.id, single.id, { session: carla })).status, 404);
  assert.ok((await list(spaceA.id, { session: ana })).body.documents.some(({ id }) => id === single.id));
});

await test("P01.7 V03 — mutations without the CSRF header are rejected", async () => {
  assertDenied(await upload(spaceA.id, [file("sin-csrf.txt")], { session: ana, csrf: "" }));
  assertDenied(await replace(spaceA.id, single.id, file("sin-csrf.md"), { session: ana, csrf: "" }));
  assertDenied(await retry(spaceA.id, single.id, { session: ana, csrf: "" }));
  assertDenied(await remove(spaceA.id, single.id, { session: ana, csrf: "" }));
  assert.ok((await list(spaceA.id, { session: ana })).body.documents.some(({ id }) => id === single.id));
});

await test("P02.3 — multipart routes refuse other content types with 415 before the backend", async () => {
  const before = (await doubleRequests(spaceA.id)).length;
  const json = await call(docs(spaceA.id), { method: "POST", body: { files: [] }, session: ana });
  assert.equal(json.status, 415);
  assert.equal(json.body.category, "format");
  const text = await call(`${docs(spaceA.id)}/${single.id}/content`, { method: "PUT", rawBody: "texto", contentType: "text/plain", session: ana });
  assert.equal(text.status, 415);
  assert.equal(text.body.category, "format");
  assert.equal((await doubleRequests(spaceA.id)).length, before);
});

await test("P02.2 — oversized or missing Content-Length gets 413 and never reaches the backend", async () => {
  const before = (await doubleRequests(spaceA.id)).length;
  const multipart = { "content-type": "multipart/form-data; boundary=x" };
  const oversized = await rawUpload(docs(spaceA.id), ana, { ...multipart, "content-length": String(uploadCap + 1) });
  assert.equal(oversized.status, 413);
  assert.equal(oversized.body.category, "limit");
  const chunked = await rawUpload(docs(spaceA.id), ana, { ...multipart, "transfer-encoding": "chunked" });
  assert.equal(chunked.status, 413);
  assert.equal(chunked.body.category, "limit");
  assert.equal((await doubleRequests(spaceA.id)).length, before);
});

await test("P01.7 — JSON library operations keep the 8,192-byte body limit", async () => {
  const response = await call(`${docs(spaceA.id)}/${single.id}/retry`, { method: "POST", rawBody: "x".repeat(8_193), session: ana });
  assert.equal(response.status, 413);
});

await test("P02.3 V03 — unknown routes, ids and methods are 404 and never reach the backend", async () => {
  const before = (await doubleRequests(spaceA.id)).length;
  const base = docs(spaceA.id);
  const attempts = [
    ["GET", `${base}/${single.id}`], ["PUT", `${base}/${single.id}`], ["PATCH", `${base}/${single.id}`],
    ["PUT", base], ["PATCH", base], ["DELETE", base],
    ["GET", `${base}/abc`], ["DELETE", `${base}/0`], ["DELETE", `${base}/1234567890123456789`], ["DELETE", `${base}/1%20OR%201=1`],
    ["GET", `${base}/${single.id}/unknown`], ["POST", `${base}/${single.id}/content`], ["GET", `${base}/${single.id}/retry`],
    ["DELETE", `${base}/${single.id}/original`], ["GET", `${base}/${single.id}/original/extra`],
    ["GET", "/api/spaces/0/documents"], ["GET", "/api/spaces/abc/documents"], ["GET", "/api/library.bxm?op=documents"],
    ["GET", "/api/documents"], ["GET", `/api/spaces/${spaceA.id}/library`],
  ];
  for (const [method, path] of attempts) {
    const response = await call(path, { method, session: ana, ...(method === "GET" ? {} : { body: {} }) });
    assert.equal(response.status, 404, `${method} ${path}`);
    assert.deepEqual(response.body, { message: "No se encontró la operación." }, `${method} ${path}`);
  }
  assert.equal((await doubleRequests(spaceA.id)).length, before);
  // The backend operation is fixed by the route: a client-supplied query cannot pick another one.
  const forged = await call(`${base}?op=deleteDocument&documentId=${single.id}&spaceId=${spaceB.id}`, { session: ana });
  assert.equal(forged.status, 200);
  assert.ok(forged.body.documents.some(({ id }) => id === single.id));
});

await test("V03 — only the session cookie and the agreed headers reach the backend", async () => {
  const probe = await createSpace(ana, `P02 ${run} headers`);
  const cookie = `tracking=synthetic; sb_session=${ana.token}; other_session=synthetic`;
  const extra = { authorization: "Bearer synthetic", "x-forwarded-for": "203.0.113.9", "x-synthetic-extra": "1", referer: `${origin}/x` };
  assert.equal((await upload(probe.id, [file("cabeceras.txt")], { session: ana, cookie, extra })).status, 200);
  assert.equal((await list(probe.id, { session: ana, cookie, extra })).status, 200);
  const seen = await doubleRequests(probe.id);
  assert.deepEqual(seen.map(({ op }) => op), ["uploadDocuments", "documents"]);
  // Set by the server-side fetch itself (`cache: "no-store"` included), not copied from the browser request.
  const transport = ["accept", "accept-encoding", "accept-language", "cache-control", "connection", "content-length", "host", "pragma", "sec-fetch-mode", "user-agent"];
  for (const entry of seen) {
    assert.deepEqual(entry.cookieNames, ["sb_session"]);
    const forwarded = entry.headerNames.filter((name) => !transport.includes(name));
    assert.deepEqual(forwarded, entry.op === "uploadDocuments" ? ["content-type", "cookie", "origin", "x-csrf-token"] : ["cookie", "origin", "x-csrf-token"]);
  }
  // The streamed upload keeps a declared length instead of becoming chunked.
  assert.ok(seen[0].headerNames.includes("content-length"));
  assert.equal(seen[0].headerNames.includes("transfer-encoding"), false);
});

await test("P02.1 V03 — download returns the exact bytes as a nosniff attachment", async () => {
  const bytes = randomFillSync(Buffer.alloc(4_096));
  const uploaded = await upload(spaceA.id, [{ name: "binario.pdf", content: bytes, type: "application/pdf" }], { session: bruno });
  const response = await download(spaceA.id, uploaded.body.results[0].document.id, { session: bruno });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.equal(response.headers.get("content-length"), "4096");
  assert.equal(response.headers.get("content-disposition"), "attachment");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.ok(Buffer.from(await response.arrayBuffer()).equals(bytes));
});

await test("P02.3 — an uploaded HTML original is served only as an attachment", async () => {
  const html = "<!doctype html><script>document.title='synthetic'</script>";
  const uploaded = await upload(spaceA.id, [file("activo.html", html, "text/html")], { session: ana });
  const response = await download(spaceA.id, uploaded.body.results[0].document.id, { session: ana });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition"), /^attachment/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await response.text(), html);
});

await test("V06 — retrying a failed document returns it to pending", async () => {
  const uploaded = await upload(spaceA.id, [file("fail-provider.txt"), file("fail-budget.md")], { session: bruno });
  const [provider, budget] = uploaded.body.results.map(({ document }) => document);
  assert.equal(provider.status, "failed");
  assert.deepEqual(provider.failure, { category: "provider", retryable: true });
  assert.deepEqual(budget.failure, { category: "budget", retryable: true });
  const retried = await retry(spaceA.id, provider.id, { session: bruno });
  assert.equal(retried.status, 200);
  assertDocumentShape(retried.body.document);
  assert.equal(retried.body.document.status, "pending");
  assert.equal(retried.body.document.failure, null);
  assert.equal((await retry(spaceA.id, budget.id, { session: ana })).body.document.status, "pending");
});

await test("V07 — replace keeps the original status and content, with a separate replacement state", async () => {
  const before = (await list(spaceA.id, { session: ana })).body.documents.find(({ id }) => id === single.id);
  const replaced = await replace(spaceA.id, single.id, file("informe-v2.md", "# Nuevo\n", "text/markdown"), { session: bruno });
  assert.equal(replaced.status, 200);
  assertDocumentShape(replaced.body.document);
  assert.equal(replaced.body.document.status, before.status);
  assert.deepEqual(replaced.body.document.replacement, { status: "pending", failure: null });
  assert.equal(await (await download(spaceA.id, single.id, { session: ana })).text(), "# Informe sintético\n");

  const target = (await upload(spaceA.id, [file("estable.txt", "contenido válido")], { session: ana })).body.results[0].document;
  const failedReplacement = await replace(spaceA.id, target.id, file("fail-provider.txt"), { session: ana });
  assert.equal(failedReplacement.status, 200);
  assert.equal(failedReplacement.body.document.status, target.status);
  assert.equal(failedReplacement.body.document.name, "estable.txt");
  assert.deepEqual(failedReplacement.body.document.replacement, { status: "failed", failure: { category: "provider", retryable: true } });
  assert.equal(await (await download(spaceA.id, target.id, { session: ana })).text(), "contenido válido");
});

await test("V08 — delete removes the document; later calls for that id are 404", async () => {
  const target = (await upload(spaceA.id, [file("borrar.txt")], { session: ana })).body.results[0].document;
  const deleted = await remove(spaceA.id, target.id, { session: bruno });
  assert.equal(deleted.status, 200);
  assert.equal(typeof deleted.body.message, "string");
  assert.equal((await list(spaceA.id, { session: ana })).body.documents.some(({ id }) => id === target.id), false);
  assert.equal((await download(spaceA.id, target.id, { session: ana })).status, 404);
  assert.equal((await retry(spaceA.id, target.id, { session: ana })).status, 404);
  assert.equal((await replace(spaceA.id, target.id, file("tarde.txt"), { session: ana })).status, 404);
  assert.equal((await remove(spaceA.id, target.id, { session: ana })).status, 404);
});

await test("P02.2 — a ~30 MB upload streams through the proxy and downloads intact", async () => {
  const bytes = randomFillSync(Buffer.alloc(30_000_000));
  const uploaded = await upload(spaceB.id, [{ name: "grande-30mb.txt", content: bytes, type: "text/plain" }], { session: ana });
  assert.equal(uploaded.status, 200);
  assert.equal(uploaded.body.results[0].accepted, true);
  assert.equal(uploaded.body.results[0].document.sizeBytes, 30_000_000);
  const response = await download(spaceB.id, uploaded.body.results[0].document.id, { session: ana });
  assert.equal(response.headers.get("content-length"), "30000000");
  const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
  assert.equal(digest(Buffer.from(await response.arrayBuffer())), digest(bytes));
  assert.equal((await remove(spaceB.id, uploaded.body.results[0].document.id, { session: ana })).status, 200);
});

console.log(`P02 frontend (TEST DOUBLE, web transport and contract only): ${passed} passed, ${failed.length} failed`);
if (failed.length) {
  for (const label of failed) console.log(`  failed: ${label}`);
  process.exit(1);
}
