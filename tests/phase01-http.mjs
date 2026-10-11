import assert from "node:assert/strict";

const run = process.env.P01_RUN ?? `run-${Date.now()}`;
assert.match(run, /^[a-z0-9-]{1,40}$/);
const backend = process.env.BOXLANG_URL ?? "http://127.0.0.1:8082";
const frontend = process.env.P01_FRONTEND_URL ?? "http://127.0.0.1:3000";
const origin = process.env.P01_ORIGIN ?? "http://127.0.0.1:3002";
const password = "phase01-synthetic-password";
const email = (role) => `p01-${run}-${role}@example.invalid`;

async function readResponse(response) {
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { status: response.status, body, headers: response.headers };
}

async function backendCall(operation, {
  method = "GET", body, token, csrf, spaceId, memberId, originHeader = origin, includeOrigin = true, rawBody,
} = {}) {
  const url = new URL("/api/account.bxm", backend);
  url.searchParams.set("op", operation);
  if (spaceId !== undefined) url.searchParams.set("spaceId", String(spaceId));
  if (memberId !== undefined) url.searchParams.set("memberId", String(memberId));
  const headers = new Headers();
  if (includeOrigin && originHeader !== null) headers.set("origin", originHeader);
  if (token) headers.set("cookie", `sb_session=${token}`);
  if (csrf) headers.set("x-csrf-token", csrf);
  if (body !== undefined || rawBody !== undefined) headers.set("content-type", "application/json");
  const payload = rawBody ?? (body === undefined ? undefined : JSON.stringify(body));
  return readResponse(await fetch(url, { method, headers, body: payload }));
}

async function frontendCall(path, {
  method = "GET", body, token, csrf, originHeader = origin, includeOrigin = true, rawBody,
} = {}) {
  const headers = new Headers();
  if (includeOrigin && originHeader !== null) headers.set("origin", originHeader);
  if (token) headers.set("cookie", `sb_session=${token}`);
  if (csrf) headers.set("x-csrf-token", csrf);
  if (body !== undefined || rawBody !== undefined) headers.set("content-type", "application/json");
  const payload = rawBody ?? (body === undefined ? undefined : JSON.stringify(body));
  return readResponse(await fetch(new URL(path, frontend), { method, headers, body: payload }));
}

function sessionFrom(response) {
  const cookie = response.headers.get("set-cookie") ?? "";
  const token = cookie.match(/(?:^|;\s*)sb_session=([A-Za-z0-9_-]{43})(?:;|$)/)?.[1];
  assert.ok(token, "login sets one opaque session cookie");
  return { token, cookie };
}

async function register(address, viaFrontend = false) {
  const response = await (viaFrontend
    ? frontendCall("/api/auth/register", { method: "POST", body: { email: address, password } })
    : backendCall("register", { method: "POST", body: { email: address, password } }));
  assert.equal(response.status, 202);
  assert.deepEqual(response.body, { message: "Solicitud procesada" });
  return response;
}

async function login(address, viaFrontend = false) {
  const response = await (viaFrontend
    ? frontendCall("/api/auth/login", { method: "POST", body: { email: address, password } })
    : backendCall("login", { method: "POST", body: { email: address, password } }));
  assert.equal(response.status, 200, `login for ${address}`);
  const { token, cookie } = sessionFrom(response);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  assert.match(cookie, /Path=\//i);
  assert.match(cookie, /Max-Age=43200/i);
  if (origin.startsWith("http://127.0.0.1:") || origin.startsWith("http://localhost:")) assert.doesNotMatch(cookie, /;\s*Secure/i);
  assert.equal(response.body.user.email, address.toLowerCase());
  assert.match(response.body.csrfToken, /^[A-Za-z0-9_-]{43}$/);
  assertNoCredentials(response.body);
  return { token, csrf: response.body.csrfToken, user: response.body.user };
}

function assertNoCredentials(body) {
  const keys = Object.keys(body).join(" ");
  assert.doesNotMatch(keys, /password|hash|session.?token|credential/i);
  assert.doesNotMatch(JSON.stringify(body), new RegExp(password, "i"));
}

function assertGenericCredentials(response) {
  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { message: "Credenciales no válidas." });
}

console.log(`P01 HTTP run: ${run}`);

// P01.1 — create, authenticate, read current session and invalidate its old cookie.
const anaAddress = email("ana");
const firstRegistration = await register(anaAddress, true);
const duplicateRegistration = await register(anaAddress, true);
assert.equal(firstRegistration.status, duplicateRegistration.status);
assert.deepEqual(firstRegistration.body, duplicateRegistration.body);
const ana = await login(anaAddress, true);
const currentViaProxy = await frontendCall("/api/auth/current", { token: ana.token });
assert.equal(currentViaProxy.status, 200);
assert.equal(currentViaProxy.body.user.email, anaAddress);
assertNoCredentials(currentViaProxy.body);
const logout = await frontendCall("/api/auth/logout", { method: "POST", token: ana.token, csrf: ana.csrf, body: {} });
assert.equal(logout.status, 200);
assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/i);
assert.equal((await backendCall("current", { token: ana.token })).status, 401);
const anaSession = await login(anaAddress);

// P01.2 — malformed input, account enumeration resistance, and a persisted fixed-window limit.
const invalidJson = await backendCall("register", { method: "POST", rawBody: "{bad" });
assert.equal(invalidJson.status, 400);
const missingOrigin = await backendCall("register", { method: "POST", body: { email: email("no-origin"), password }, includeOrigin: false });
assert.equal(missingOrigin.status, 403);
const wrongOrigin = await backendCall("login", { method: "POST", body: { email: anaAddress, password }, originHeader: "https://attacker.invalid" });
assert.equal(wrongOrigin.status, 403);
const missingUser = await backendCall("login", { method: "POST", body: { email: email("absent"), password } });
const wrongPassword = await backendCall("login", { method: "POST", body: { email: anaAddress, password: "wrong-synthetic-password" } });
assertGenericCredentials(missingUser);
assertGenericCredentials(wrongPassword);
const abuseAddress = email("abuse");
await register(abuseAddress);
for (let attempt = 1; attempt <= 10; attempt++) {
  assertGenericCredentials(await backendCall("login", { method: "POST", body: { email: abuseAddress, password: "wrong-synthetic-password" } }));
}
const rateLimited = await backendCall("login", { method: "POST", body: { email: abuseAddress, password: "wrong-synthetic-password" } });
assert.equal(rateLimited.status, 429);

// Accounts used in the permission matrix.
const brunoAddress = email("bruno");
const carlaAddress = email("carla");
const dianaAddress = email("diana");
await register(brunoAddress);
await register(carlaAddress);
await register(dianaAddress);
const bruno = await login(brunoAddress);
const carla = await login(carlaAddress);
const diana = await login(dianaAddress);

// P01.4 — space isolation and effective role matrix; P01.3 — identical, non-enumerating incorporation.
const createSpace = async (session, name, body = {}) => backendCall("createSpace", {
  method: "POST", token: session.token, csrf: session.csrf, body: { name, ...body },
});
const policiesResponse = await createSpace(anaSession, "Políticas");
assert.equal(policiesResponse.status, 201);
const policies = policiesResponse.body.space;
const privateResponse = await createSpace(anaSession, "Notas privadas");
assert.equal(privateResponse.status, 201);
const privateSpace = privateResponse.body.space;
assert.equal(policies.role, "admin");

const add = (session, spaceId, address, role) => backendCall("addMember", {
  method: "POST", token: session.token, csrf: session.csrf, spaceId, body: { email: address, role },
});
const brunoAdded = await add(anaSession, policies.id, brunoAddress, "editor");
const absentAdded = await add(anaSession, policies.id, email("absent"), "reader");
assert.equal(brunoAdded.status, 200);
assert.deepEqual(brunoAdded.body, { message: "Solicitud procesada" });
assert.equal(absentAdded.status, brunoAdded.status);
assert.deepEqual(absentAdded.body, brunoAdded.body);
await add(anaSession, policies.id, carlaAddress, "reader");
// Existing membership is idempotent and cannot be demoted through an add/upsert path.
await add(anaSession, policies.id, brunoAddress, "admin");

const spacesOf = async (session) => (await backendCall("spaces", { token: session.token })).body.spaces;
assert.equal((await spacesOf(anaSession)).length, 2);
assert.equal((await spacesOf(bruno)).length, 1);
assert.equal((await spacesOf(carla)).length, 1);
assert.equal((await spacesOf(diana)).length, 0);
assert.equal((await backendCall("space", { token: bruno.token, spaceId: policies.id })).status, 200);
assert.equal((await backendCall("space", { token: bruno.token, spaceId: privateSpace.id })).status, 403);
assert.equal((await backendCall("space", { token: diana.token, spaceId: policies.id })).status, 403);
assert.equal((await backendCall("members", { token: anaSession.token, spaceId: policies.id })).status, 200);
assert.equal((await backendCall("members", { token: bruno.token, spaceId: policies.id })).status, 403);
assert.equal((await backendCall("members", { token: carla.token, spaceId: policies.id })).status, 403);
assert.equal((await backendCall("members", { token: diana.token, spaceId: policies.id })).status, 403);

const managerDenied = await add(bruno, policies.id, dianaAddress, "reader");
assert.equal(managerDenied.status, 403);
assert.equal((await backendCall("changeMember", {
  method: "PATCH", token: bruno.token, csrf: bruno.csrf, spaceId: policies.id, memberId: carla.user.id, body: { role: "admin" },
})).status, 403);
assert.equal((await backendCall("removeMember", {
  method: "DELETE", token: carla.token, csrf: carla.csrf, spaceId: policies.id, memberId: bruno.user.id,
})).status, 403);
const policyMembers = (await backendCall("members", { token: anaSession.token, spaceId: policies.id })).body.members;
assert.equal(policyMembers.find((member) => member.id === bruno.user.id)?.role, "editor");
assert.equal(policyMembers.find((member) => member.id === carla.user.id)?.role, "reader");
assert.equal(policyMembers.some((member) => member.email === email("absent")), false);

// P01.5 — last-admin protection, serialized competing demotions and safe membership incorporation.
const solo = (await createSpace(anaSession, "Solo")).body.space;
assert.equal((await backendCall("changeMember", {
  method: "PATCH", token: anaSession.token, csrf: anaSession.csrf, spaceId: solo.id, memberId: anaSession.user.id, body: { role: "reader" },
})).status, 409);
assert.equal((await backendCall("removeMember", {
  method: "DELETE", token: anaSession.token, csrf: anaSession.csrf, spaceId: solo.id, memberId: anaSession.user.id,
})).status, 409);
await add(anaSession, solo.id, anaAddress, "reader");
assert.equal((await backendCall("members", { token: anaSession.token, spaceId: solo.id })).body.members[0].role, "admin");

const race = (await createSpace(anaSession, "Concurrencia")).body.space;
await add(anaSession, race.id, brunoAddress, "admin");
await add(anaSession, race.id, carlaAddress, "admin");
const concurrent = await Promise.all([
  backendCall("changeMember", {
    method: "PATCH", token: anaSession.token, csrf: anaSession.csrf, spaceId: race.id, memberId: carla.user.id, body: { role: "reader" },
  }),
  backendCall("changeMember", {
    method: "PATCH", token: carla.token, csrf: carla.csrf, spaceId: race.id, memberId: anaSession.user.id, body: { role: "reader" },
  }),
]);
assert.ok(concurrent.some((response) => response.status === 200), `one serialized demotion should proceed: ${concurrent.map(({ status }) => status)}`);
assert.ok(concurrent.every((response) => [200, 403, 409].includes(response.status)), `unexpected race status: ${concurrent.map(({ status }) => status)}`);
const raceMembers = (await backendCall("members", { token: anaSession.token, spaceId: race.id })).status === 200
  ? (await backendCall("members", { token: anaSession.token, spaceId: race.id })).body.members
  : (await backendCall("members", { token: carla.token, spaceId: race.id })).body.members;
assert.ok(raceMembers.filter((member) => member.role === "admin").length >= 1);

// P01.6 — membership removal denies the next protected backend request, but does not kill the account session.
const removed = await backendCall("removeMember", {
  method: "DELETE", token: anaSession.token, csrf: anaSession.csrf, spaceId: policies.id, memberId: bruno.user.id,
});
assert.equal(removed.status, 200);
assert.equal((await backendCall("space", { token: bruno.token, spaceId: policies.id })).status, 403);
assert.equal((await backendCall("current", { token: bruno.token })).status, 200);

// P01.7 — client-controlled IDs/roles, CSRF and Origin cannot extend privileges.
const forgedSpace = await createSpace(anaSession, "Propietario ignorado", { userId: diana.user.id, role: "reader" });
assert.equal(forgedSpace.status, 201);
assert.equal(forgedSpace.body.space.role, "admin");
assert.equal((await backendCall("space", { token: diana.token, spaceId: forgedSpace.body.space.id })).status, 403);
assert.equal((await backendCall("createSpace", {
  method: "POST", token: anaSession.token, body: { name: "Sin CSRF" },
})).status, 403);
assert.equal((await backendCall("createSpace", {
  method: "POST", token: anaSession.token, csrf: anaSession.csrf, originHeader: "https://attacker.invalid", body: { name: "Origen falso" },
})).status, 403);
assert.equal((await backendCall("createSpace", {
  method: "POST", token: anaSession.token, csrf: "wrong-token", body: { name: "CSRF falso" },
})).status, 403);
assert.equal((await backendCall("logout", { method: "POST", token: anaSession.token, csrf: "wrong-token", body: {} })).status, 403);
assert.equal((await backendCall("current", { token: anaSession.token })).status, 200);
assert.equal((await backendCall("space", { token: anaSession.token, spaceId: "1 OR 1=1" })).status, 403);
assert.equal((await backendCall("changeMember", {
  method: "PATCH", token: anaSession.token, csrf: anaSession.csrf, spaceId: policies.id, memberId: "1 OR 1=1", body: { role: "admin" },
})).status, 400);
assert.equal((await add(anaSession, policies.id, dianaAddress, "owner")).status, 400);
assert.equal((await frontendCall("/api/auth/register", { method: "POST", body: { email: email("oversize"), password }, rawBody: "x".repeat(8193) })).status, 413);

const currentSpaceNames = (await backendCall("spaces", { token: anaSession.token })).body.spaces.map(({ name }) => name);
assert.equal(currentSpaceNames.includes("Sin CSRF"), false);
assert.equal(currentSpaceNames.includes("Origen falso"), false);
assertNoCredentials((await backendCall("current", { token: anaSession.token })).body);
console.log("OK P01 HTTP: proxy/cookie/session/logout, generic registration/login, persisted rate limit, space isolation, role matrix, same incorporation result, last-admin race, revocation, CSRF/Origin and manipulated-input rejection.");
