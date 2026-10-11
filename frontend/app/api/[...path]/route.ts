const bodyLimit = 8_192;

// Early transport caps for multipart bodies, which are streamed and never
// buffered here. The authoritative limits are enforced by BoxLang; these
// mirror the proposed defaults in docs/plan/00-viabilidad-y-decisiones.md
// (20 files/operation, 50 MB = 50,000,000 bytes/file) plus multipart overhead.
const maxFilesPerUpload = 20;
const maxFileBytes = 50_000_000;
const multipartOverheadBytes = 1_000_000;
const uploadBodyLimit = maxFilesPerUpload * maxFileBytes + multipartOverheadBytes;
const replaceBodyLimit = maxFileBytes + multipartOverheadBytes;

const idPattern = /^[1-9][0-9]{0,17}$/;

type Operation = {
  op: string;
  spaceId?: string;
  memberId?: string;
  documentId?: string;
  endpoint?: "library";
  // Multipart operations carry the cap applied to their streamed body.
  streamLimit?: number;
  download?: boolean;
};

function resolveOperation(pathname: string, method: string): Operation | null {
  const parts = pathname.split("/").filter(Boolean).slice(1);
  if (parts[0] === "auth" && parts.length === 2) {
    const operations: Record<string, { method: string; op: string }> = {
      register: { method: "POST", op: "register" },
      login: { method: "POST", op: "login" },
      current: { method: "GET", op: "current" },
      logout: { method: "POST", op: "logout" },
    };
    const match = operations[parts[1]];
    return match?.method === method ? { op: match.op } : null;
  }

  if (parts[0] !== "spaces") return null;
  if (parts.length === 1) {
    if (method === "GET") return { op: "spaces" };
    if (method === "POST") return { op: "createSpace" };
    return null;
  }

  const spaceId = parts[1];
  if (!/^[1-9][0-9]{0,17}$/.test(spaceId)) return null;
  if (parts.length === 2 && method === "GET") return { op: "space", spaceId };
  if (parts.length === 3 && parts[2] === "members") {
    if (method === "GET") return { op: "members", spaceId };
    if (method === "POST") return { op: "addMember", spaceId };
    return null;
  }
  if (parts.length === 4 && parts[2] === "members" && /^[1-9][0-9]{0,17}$/.test(parts[3])) {
    if (method === "PATCH") return { op: "changeMember", spaceId, memberId: parts[3] };
    if (method === "DELETE") return { op: "removeMember", spaceId, memberId: parts[3] };
  }
  if (parts[2] === "documents") return resolveLibraryOperation(parts.slice(3), method, spaceId);
  return null;
}

function resolveLibraryOperation(parts: string[], method: string, spaceId: string): Operation | null {
  const library = { endpoint: "library" as const, spaceId };
  if (parts.length === 0) {
    if (method === "GET") return { ...library, op: "documents" };
    if (method === "POST") return { ...library, op: "uploadDocuments", streamLimit: uploadBodyLimit };
    return null;
  }

  const documentId = parts[0];
  if (!idPattern.test(documentId)) return null;
  if (parts.length === 1) {
    return method === "DELETE" ? { ...library, op: "deleteDocument", documentId } : null;
  }
  if (parts.length !== 2) return null;
  if (parts[1] === "content" && method === "PUT") {
    return { ...library, op: "replaceDocument", documentId, streamLimit: replaceBodyLimit };
  }
  if (parts[1] === "retry" && method === "POST") return { ...library, op: "retryDocument", documentId };
  if (parts[1] === "original" && method === "GET") return { ...library, op: "originalDocument", documentId, download: true };
  return null;
}

// Multipart bodies are checked by their declared length only: the server
// never hands the handler more bytes than Content-Length announces.
function rejectStream(request: Request, limit: number): Response | null {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return Response.json({ message: "El formato de la solicitud no es compatible.", category: "format" }, { status: 415 });
  }
  const declared = request.headers.get("content-length") ?? "";
  if (!/^[0-9]{1,15}$/.test(declared) || Number(declared) > limit) {
    return Response.json({ message: "La solicitud supera el tamaño permitido.", category: "limit" }, { status: 413 });
  }
  return null;
}

// Originals are always downloads: an uploaded HTML or SVG must never render on this origin.
function downloadResponse(upstream: Response): Response {
  const headers = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);
  const disposition = upstream.headers.get("content-disposition") ?? "";
  headers.set("content-disposition", /^attachment\s*(?:;|$)/i.test(disposition) ? disposition : "attachment");
  return new Response(upstream.body, { status: upstream.status, headers });
}

async function readBody(request: Request): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > bodyLimit) {
      await reader.cancel();
      throw new RangeError("Request body is too large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function delegate(request: Request): Promise<Response> {
  const route = resolveOperation(new URL(request.url).pathname, request.method);
  if (!route) return Response.json({ message: "No se encontró la operación." }, { status: 404 });

  let body: Uint8Array = new Uint8Array();
  if (route.streamLimit) {
    const rejection = rejectStream(request, route.streamLimit);
    if (rejection) return rejection;
  } else {
    try {
      body = await readBody(request);
    } catch {
      return Response.json({ message: "La solicitud supera el tamaño permitido." }, { status: 413 });
    }
  }

  const backend = new URL(route.endpoint === "library" ? "/api/library.bxm" : "/api/account.bxm", process.env.BOXLANG_URL);
  backend.searchParams.set("op", route.op);
  if (route.spaceId) backend.searchParams.set("spaceId", route.spaceId);
  if (route.memberId) backend.searchParams.set("memberId", route.memberId);
  if (route.documentId) backend.searchParams.set("documentId", route.documentId);

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const origin = request.headers.get("origin");
  const csrfToken = request.headers.get("x-csrf-token");
  if (contentType) headers.set("content-type", contentType);
  if (origin) headers.set("origin", origin);
  if (csrfToken) headers.set("x-csrf-token", csrfToken);
  const authCookies = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.toLowerCase().startsWith("sb_session="));
  if (authCookies.length) headers.set("cookie", authCookies.join("; "));

  try {
    // A streamed body keeps its declared length so BoxLang receives it unbuffered and sized.
    const stream = route.streamLimit ? request.body : null;
    if (stream) headers.set("content-length", request.headers.get("content-length") ?? "");
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      body: stream ?? (body.byteLength ? new TextDecoder().decode(body) : undefined),
      cache: "no-store",
      signal: request.signal,
    };
    if (stream) init.duplex = "half";
    const upstream = await fetch(backend, init);
    if (route.download && upstream.ok) return downloadResponse(upstream);
    if (!upstream.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ message: "El servicio no está disponible." }, { status: 502 });
    }
    const responseHeaders = new Headers({
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("set-cookie", setCookie);
    return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ message: "El servicio no está disponible." }, { status: 502 });
  }
}

export const GET = delegate;
export const POST = delegate;
export const PUT = delegate;
export const PATCH = delegate;
export const DELETE = delegate;
