import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const locations = JSON.parse(await readFile(new URL("./fixtures/locations.json", import.meta.url)));
assert.equal(locations.length, 4);
assert.deepEqual(locations.find((x) => x.kind === "line").start, { line: 2 });
assert.equal(locations.find((x) => x.kind === "json").start.path, "policy.maxDays");
assert.equal(locations.find((x) => x.kind === "csv").start.row, 3);
for (const file of ["locations.md", "locations.txt", "locations.js", "locations.csv"]) {
  const content = await readFile(new URL(`./fixtures/${file}`, import.meta.url), "utf8");
  assert.ok(content.includes("repeat: exact target"), `${file} fixture has exact quote`);
}
const jsonFixture = JSON.parse(await readFile(new URL("./fixtures/locations.jsondata", import.meta.url), "utf8"));
assert.equal(jsonFixture.policy.maxDays, 10);
assert.equal(jsonFixture.other.maxDays, 10);
assert.ok(locations.every((location) => location.quote.length > 0));
console.log("OK: deterministic fixture location contract and repeated-value content assertions");
