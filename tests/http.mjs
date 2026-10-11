import assert from "node:assert/strict";

const endpoint = `${process.env.BOXLANG_URL}/api/health.bxm`;
const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
assert.equal(response.status, 200);
assert.match(response.headers.get("content-type"), /application\/json/);
assert.deepEqual(await response.json(), { status: "ok", backend: "BoxLang" });

const rejected = await fetch(endpoint, { method: "POST", signal: AbortSignal.timeout(10000) });
assert.equal(rejected.status, 405);
assert.equal(rejected.headers.get("allow"), "GET");
assert.deepEqual(await rejected.json(), { error: "Solo se permite GET." });

const page = await fetch("http://127.0.0.1:3000/app", { signal: AbortSignal.timeout(30000) });
assert.equal(page.status, 200);
assert.match(await page.text(), /data-backend-status="ok"/);
console.log("OK: GET BoxLang, rechazo de POST y conexión desde Next.js.");
