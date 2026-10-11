const bodyLimit = 8_192;

type Operation = { op: string; spaceId?: string; memberId?: string };

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
  return null;
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

  let body: Uint8Array;
  try {
    body = await readBody(request);
  } catch {
    return Response.json({ message: "La solicitud supera el tamaño permitido." }, { status: 413 });
  }

  const backend = new URL("/api/account.bxm", process.env.BOXLANG_URL);
  backend.searchParams.set("op", route.op);
  if (route.spaceId) backend.searchParams.set("spaceId", route.spaceId);
  if (route.memberId) backend.searchParams.set("memberId", route.memberId);

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
    const upstream = await fetch(backend, {
      method: request.method,
      headers,
      body: body.byteLength ? new TextDecoder().decode(body) : undefined,
      cache: "no-store",
      signal: request.signal,
    });
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
export const PATCH = delegate;
export const DELETE = delegate;
