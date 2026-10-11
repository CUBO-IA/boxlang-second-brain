// TEST DOUBLE — NOT the Second Brain library.
//
// Stands in for the phase 02 BoxLang library backend (/api/library.bxm, plan
// tasks 02.1–02.6), which does not exist yet, so the web client can be built
// and its transport tested against the contract in frontend/app/lib/library.ts.
// Nothing here persists, indexes, extracts, budgets or calls a provider, and
// its results must never be presented as real library behaviour or as
// evidence for P02.1–P02.7. Document states are driven by FILE NAME (see
// classify) so every state is reachable without AI.
//
// Everything that is not /api/library.bxm is forwarded untouched to the real
// BoxLang service, and library authorization is real: the caller's role comes
// from BoxLang's own `space` operation on every call.
//
//   LIBRARY_DOUBLE_UPSTREAM          real BoxLang base URL (required)
//   LIBRARY_DOUBLE_PORT              default 9090, bound to 127.0.0.1
//   LIBRARY_DOUBLE_BUDGET_EXHAUSTED  YES flips budget.exhausted in listings
//   LIBRARY_DOUBLE_DEBUG             YES enables GET /__double/requests
import http from "node:http";

const upstream = process.env.LIBRARY_DOUBLE_UPSTREAM;
if (!upstream) {
  console.error("LIBRARY_DOUBLE_UPSTREAM is required (the real BoxLang base URL).");
  process.exit(1);
}
const port = Number(process.env.LIBRARY_DOUBLE_PORT ?? 9090);
const budgetExhausted = process.env.LIBRARY_DOUBLE_BUDGET_EXHAUSTED === "YES";
const debug = process.env.LIBRARY_DOUBLE_DEBUG === "YES";

const limits = { maxFileBytes: 50_000_000, maxDocuments: 1_000, maxFilesPerUpload: 20 };
const bodyCap = limits.maxFilesPerUpload * limits.maxFileBytes + 1_000_000;
const processingAfterMs = 2_000;
const supportedFormats = new Set([
  "pdf", "md", "txt", "json", "docx", "csv", "xlsx", "js", "ts", "py", "java", "sql", "yaml", "yml", "toml", "bx", "bxs", "cfm", "cfc",
]);
const operations = {
  documents: { method: "GET" },
  originalDocument: { method: "GET", document: true },
  uploadDocuments: { method: "POST", mutation: true },
  replaceDocument: { method: "PUT", mutation: true, document: true },
  retryDocument: { method: "POST", mutation: true, document: true },
  deleteDocument: { method: "DELETE", mutation: true, document: true },
};

// spaceId → Map(documentId → record). Records never leave their space.
const spaces = new Map();
let nextDocumentId = 1;
const received = [];

const failure = (status, message, category) => ({ status, body: category ? { message, category } : { message } });
const notFound = () => failure(404, "No se encontró el documento.");

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

function forward(request, response) {
  const target = new URL(request.url, upstream);
  const headers = { ...request.headers, host: target.host };
  const proxied = http.request(target, { method: request.method, headers }, (answer) => {
    response.writeHead(answer.statusCode ?? 502, answer.headers);
    answer.pipe(response);
  });
  proxied.on("error", () => {
    if (!response.headersSent) sendJson(response, 502, { message: "El servicio no está disponible." });
    else response.destroy();
  });
  request.pipe(proxied);
}

// Always drains the request so the caller can finish sending; keeps at most bodyCap bytes.
function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size <= bodyCap) chunks.push(chunk);
    });
    request.on("end", () => resolve(size > bodyCap ? null : Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function sessionCookie(request) {
  return (request.headers.cookie ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.toLowerCase().startsWith("sb_session="))
    .join("; ");
}

// Real authorization: BoxLang decides whether this session may see the space and with which role.
async function roleFor(request, spaceId) {
  const url = new URL("/api/account.bxm", upstream);
  url.searchParams.set("op", "space");
  url.searchParams.set("spaceId", spaceId);
  const headers = new Headers();
  const cookie = sessionCookie(request);
  if (cookie) headers.set("cookie", cookie);
  if (request.headers.origin) headers.set("origin", request.headers.origin);
  const answer = await fetch(url, { headers, cache: "no-store" });
  let body = {};
  try { body = await answer.json(); } catch { /* reported through the status below */ }
  if (answer.status === 200 && ["admin", "editor", "reader"].includes(body.space?.role)) return { role: body.space.role };
  if (answer.status === 401 || answer.status === 403) {
    return { denied: failure(answer.status, typeof body.message === "string" ? body.message : "No tienes permiso.", "permission") };
  }
  return { denied: failure(502, "El servicio no está disponible.") };
}

// Minimal multipart reader for small test bodies: boundary split, no nested parts.
function parseMultipart(contentType, body, fieldName) {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (!boundary) return null;
  const delimiter = Buffer.from(`--${boundary[1] ?? boundary[2]}`);
  const files = [];
  let position = body.indexOf(delimiter);
  while (position !== -1) {
    const start = position + delimiter.length;
    const next = body.indexOf(delimiter, start);
    if (next === -1) break;
    const headerEnd = body.indexOf("\r\n\r\n", start);
    if (headerEnd !== -1 && headerEnd < next) {
      const head = body.subarray(start, headerEnd).toString("utf8");
      const disposition = head.match(/^content-disposition:(.*)$/im)?.[1] ?? "";
      const filename = disposition.match(/filename="([^"]*)"/i)?.[1];
      if (disposition.match(/[;\s]name="([^"]*)"/i)?.[1] === fieldName && filename !== undefined) {
        files.push({
          name: filename.replaceAll("%22", '"').replaceAll("%0D", "\r").replaceAll("%0A", "\n"),
          contentType: head.match(/^content-type:\s*(.+)$/im)?.[1].trim() ?? "application/octet-stream",
          bytes: body.subarray(headerEnd + 4, next - 2),
        });
      }
    }
    position = next;
  }
  return files;
}

// File-name-driven outcomes. A stored file is never "available": phase 02 has no real pipeline.
function classify(file) {
  const name = file.name;
  if (!name || name.length > 255 || /[\\/\u0000-\u001f]/.test(name) || name.includes("..")) return { rejected: "format" };
  if (name.includes("reject-limit") || file.bytes.length > limits.maxFileBytes) return { rejected: "limit" };
  const format = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "";
  if (name.includes("unsupported") || !supportedFormats.has(format)) {
    return { format, status: "unsupported", failure: { category: "format", retryable: false } };
  }
  if (name.includes("fail-provider")) return { format, status: "failed", failure: { category: "provider", retryable: true } };
  if (name.includes("fail-budget")) return { format, status: "failed", failure: { category: "budget", retryable: true } };
  return { format, status: "pending", failure: null };
}

// "pending" becomes "processing" on read once enough time has passed; no timers.
function settle(state) {
  if (state.status === "pending" && Date.now() - state.since >= processingAfterMs) {
    state.status = "processing";
    state.updatedAt = new Date(state.since + processingAfterMs).toISOString();
  }
}

function view(record) {
  settle(record);
  if (record.replacement) settle(record.replacement);
  const updatedAt = record.replacement && record.replacement.updatedAt > record.updatedAt ? record.replacement.updatedAt : record.updatedAt;
  return {
    id: record.id,
    name: record.name,
    source: "file",
    format: record.format,
    sizeBytes: record.bytes.length,
    status: record.status,
    failure: record.failure,
    replacement: record.replacement ? { status: record.replacement.status, failure: record.replacement.failure } : null,
    updatedAt,
  };
}

function handleLibrary(operation, request, spaceId, documentId, body) {
  const documents = spaces.get(spaceId) ?? new Map();
  spaces.set(spaceId, documents);
  const contentType = request.headers["content-type"] ?? "";
  const record = documentId ? documents.get(Number(documentId)) : undefined;
  if (operations[operation].document && !record) return notFound();

  if (operation === "documents") {
    return { status: 200, body: { documents: [...documents.values()].map(view), limits, budget: { exhausted: budgetExhausted } } };
  }

  if (operation === "originalDocument") {
    // "inline" on purpose: the web proxy must turn every original into an attachment.
    return {
      status: 200,
      raw: record.bytes,
      headers: { "content-type": record.contentType, "content-length": record.bytes.length, "content-disposition": "inline" },
    };
  }

  if (operation === "uploadDocuments" || operation === "replaceDocument") {
    if (body === null) return failure(413, "La solicitud supera el tamaño permitido.", "limit");
    const files = contentType.toLowerCase().startsWith("multipart/form-data")
      ? parseMultipart(contentType, body, operation === "uploadDocuments" ? "files" : "file")
      : null;
    if (!files || files.length === 0) return failure(400, "Revisa los datos enviados.", "format");

    if (operation === "uploadDocuments") {
      if (files.length > limits.maxFilesPerUpload) return failure(413, "La operación supera el número de archivos permitido.", "limit");
      const results = files.map((file) => {
        const outcome = classify(file);
        if (outcome.rejected) return { name: file.name, accepted: false, category: outcome.rejected };
        if (documents.size >= limits.maxDocuments) return { name: file.name, accepted: false, category: "limit" };
        const now = Date.now();
        const created = {
          id: nextDocumentId++, name: file.name, format: outcome.format, bytes: file.bytes, contentType: file.contentType,
          status: outcome.status, failure: outcome.failure, since: now, updatedAt: new Date(now).toISOString(), replacement: null,
        };
        documents.set(created.id, created);
        return { name: file.name, accepted: true, document: view(created) };
      });
      return { status: 200, body: { results } };
    }

    // Double-only choices where the contract is silent: one replacement at a
    // time (409 conflict), and an invalid replacement file is refused outright.
    if (files.length !== 1) return failure(400, "Revisa los datos enviados.", "format");
    if (record.replacement && record.replacement.status !== "failed") return failure(409, "Ya hay un reemplazo en curso.", "conflict");
    const outcome = classify(files[0]);
    if (outcome.rejected === "limit") return failure(413, "El archivo supera el tamaño permitido.", "limit");
    if (outcome.rejected || outcome.status === "unsupported") return failure(415, "El formato del archivo no es compatible.", "format");
    // The original keeps its name, bytes and status: this double never publishes a replacement.
    const now = Date.now();
    record.replacement = { status: outcome.status, failure: outcome.failure, since: now, updatedAt: new Date(now).toISOString() };
    return { status: 200, body: { document: view(record) } };
  }

  if (operation === "retryDocument") {
    // Double-only choice: a failed replacement is retried before the document itself.
    const target = record.replacement?.status === "failed" ? record.replacement : record;
    if (target.status !== "failed" || !target.failure?.retryable) return failure(409, "El documento no se puede reintentar.", "conflict");
    target.status = "pending";
    target.failure = null;
    target.since = Date.now();
    target.updatedAt = new Date(target.since).toISOString();
    return { status: 200, body: { document: view(record) } };
  }

  documents.delete(record.id);
  return { status: 200, body: { message: "Documento eliminado." } };
}

async function library(request, response, url) {
  const operation = url.searchParams.get("op") ?? "";
  const spaceId = url.searchParams.get("spaceId") ?? "";
  const documentId = url.searchParams.get("documentId") ?? "";
  if (debug) {
    // Names only: never header or cookie values.
    received.push({
      op: operation, spaceId, documentId, method: request.method,
      headerNames: Object.keys(request.headers).sort(),
      cookieNames: (request.headers.cookie ?? "").split(";").map((part) => part.split("=")[0].trim()).filter(Boolean),
    });
    if (received.length > 200) received.shift();
  }

  const body = await readBody(request);
  const answer = await (async () => {
    const spec = operations[operation];
    if (!spec) return failure(404, "No se encontró la operación.");
    if (spec.method !== request.method) return failure(405, "Método no permitido.");
    const idPattern = /^[1-9][0-9]{0,17}$/;
    if (!idPattern.test(spaceId) || (spec.document && !idPattern.test(documentId))) return failure(400, "Revisa los datos enviados.");
    const access = await roleFor(request, spaceId);
    if (access.denied) return access.denied;
    if (spec.mutation) {
      // The double can only see that a token is present; validating its value
      // against the session is BoxLang's job and is NOT covered here.
      if (!request.headers["x-csrf-token"]) return failure(403, "No tienes permiso.", "permission");
      if (access.role === "reader") return failure(403, "No tienes permiso.", "permission");
    }
    return handleLibrary(operation, request, spaceId, documentId, body);
  })();

  if (answer.raw) {
    response.writeHead(answer.status, { ...answer.headers, "cache-control": "no-store" });
    response.end(answer.raw);
  } else {
    sendJson(response, answer.status, answer.body);
  }
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://double.invalid");
  if (url.pathname === "/api/library.bxm") {
    library(request, response, url).catch(() => {
      if (!response.headersSent) sendJson(response, 500, { message: "El doble de pruebas falló." });
      else response.destroy();
    });
  } else if (debug && url.pathname === "/__double/requests" && request.method === "GET") {
    sendJson(response, 200, { double: true, requests: received });
  } else {
    forward(request, response);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`TEST DOUBLE for /api/library.bxm on 127.0.0.1:${port} → ${upstream} (not the real library)`);
});
