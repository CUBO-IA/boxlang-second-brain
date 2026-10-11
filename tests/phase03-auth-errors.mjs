import assert from "node:assert/strict";

import { handleAuthorizationFailure } from "../frontend/app/lib/authorization-error.mjs";

const actions = [];
const handlers = {
  onSessionExpired: () => actions.push("session-expired"),
  onForbidden: () => actions.push("forbidden"),
};

assert.equal(handleAuthorizationFailure({ status: 401 }, () => true, handlers), true);
assert.deepEqual(actions, ["session-expired"]);
assert.equal(handleAuthorizationFailure({ status: 403 }, () => true, handlers), true);
assert.deepEqual(actions, ["session-expired", "forbidden"]);
assert.equal(handleAuthorizationFailure({ status: 401 }, () => false, handlers), true);
assert.equal(handleAuthorizationFailure({ status: 403 }, () => false, handlers), true);
assert.deepEqual(actions, ["session-expired", "forbidden"], "stale authorization failures must not run reset callbacks");
assert.equal(handleAuthorizationFailure({ status: 500 }, () => true, handlers), false);

console.log("OK: current 401/403 invoke session/membership reset; stale auth failures are discarded; other errors remain available to callers.");
