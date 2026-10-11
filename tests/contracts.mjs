import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const fixtureRoot = "/tests/fixtures";
const exported = JSON.parse(await readFile("/app/app/evidence.generated.json", "utf8"));
assert.equal(exported.version, 1);
assert.match(exported.extractor, /bx-ai loaders \+ bounded PDFBox\/OOXML EvidenceExtractor/);
assert.equal(exported.documents.length, 8);

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
async function assertFresh(record) {
  const actual = await readFile(`${fixtureRoot}/${record.id}`);
  assert.equal(sha256(actual), record.sha256, `${record.id} changed: regenerate evidence.generated.json`);
}
function coordinateKey(location, side) {
  const point = location[side];
  switch (location.kind) {
    case "line": return point.line;
    case "docx-paragraph": return point.paragraph;
    case "pdf-page": return point.page;
    case "json-path": return point.path;
    case "csv-cell": return `${point.row}:${point.column}`;
    case "xlsx-cell": return `${point.sheet}!${point.cell}`;
    default: throw new Error(`Unsupported coordinate kind ${location.kind}`);
  }
}
function resolve(record) {
  const { kind, start, end, quote } = record.location;
  assert.ok(quote.length > 0, `${record.id} has a non-empty quote`);
  for (const point of [start, end]) {
    for (const key of ["line", "paragraph", "page", "row", "offset"]) {
      if (key in point) assert.ok(Number.isInteger(point[key]) && point[key] > 0, `${record.id} ${key} must be a positive integer`);
    }
  }
  assert.equal(coordinateKey(record.location, "start"), coordinateKey(record.location, "end"), `${record.id} range cannot end on another line/page/paragraph/path/cell`);
  assert.ok(end.offset >= start.offset, `${record.id} end offset precedes start`);
  assert.equal(end.offset - start.offset + 1, quote.length, `${record.id} range length matches quote`);
  let text;
  if (kind === "line") text = record.content.split("\n")[start.line - 1];
  else {
    const key = kind === "docx-paragraph" ? `paragraph${start.paragraph}`
      : kind === "pdf-page" ? `page${start.page}`
      : kind === "json-path" ? start.path
      : kind === "csv-cell" ? `row${start.row}:${start.column}`
      : `${start.sheet}!${start.cell}`;
    text = record.rows.find((row) => row.key === key)?.text;
  }
  assert.ok(text !== undefined, `${record.id} coordinate resolves in the extracted representation`);
  assert.equal(text.slice(start.offset - 1, end.offset), quote, `${record.id} exact source quote`);
  return { text, index: kind === "line" ? start.line - 1 : record.rows.findIndex((row) => row.text === text && row.key === (kind === "docx-paragraph" ? `paragraph${start.paragraph}` : kind === "pdf-page" ? `page${start.page}` : kind === "json-path" ? start.path : kind === "csv-cell" ? `row${start.row}:${start.column}` : `${start.sheet}!${start.cell}`)) };
}

function resolveManifestEvidence(source, location) {
  const { kind, quote } = location;
  assert.ok(quote, "evidence quote is required");
  let value;
  if (kind === "line") {
    assert.ok(Number.isInteger(location.line) && location.line > 0);
    const line = source.text.split("\n")[location.line - 1];
    assert.notEqual(line, undefined, "line coordinate exists");
    value = line.slice(location.start - 1, location.end);
  } else if (kind === "json-path") {
    assert.ok(location.path && Number.isInteger(location.start) && Number.isInteger(location.end));
    value = location.path.split(".").reduce((node, key) => {
      assert.ok(node && typeof node === "object" && Object.hasOwn(node, key), `JSON path segment ${key} exists`);
      return node[key];
    }, JSON.parse(source.text));
    assert.ok(["string", "number", "boolean"].includes(typeof value), "JSON citation must resolve to a scalar");
    value = String(value).slice(location.start - 1, location.end);
  } else if (kind === "csv-cell") {
    assert.ok(Number.isInteger(location.row) && location.row > 0, "CSV row is a positive integer");
    assert.ok(location.column, "CSV column is required");
    const lines = source.text.split("\n");
    assert.ok(lines.every((line) => !line.includes('"')), "quoted CSV is outside this frozen fixture subset");
    const headers = lines[0].split(",");
    assert.equal(new Set(headers).size, headers.length, "CSV headers are unique");
    const column = headers.indexOf(location.column);
    assert.ok(column >= 0, `CSV column ${location.column} exists`);
    const row = lines[location.row - 1];
    assert.notEqual(row, undefined, `CSV row ${location.row} exists`);
    value = row.split(",")[column];
    assert.notEqual(value, undefined, `CSV row ${location.row} has column ${location.column}`);
    value = value.slice(location.start - 1, location.end);
  } else if (kind === "pdf-page" || kind === "xlsx-cell") {
    const record = exported.documents.find(({ id }) => id === source.file);
    assert.ok(record, `${kind} has a BoxLang extraction export`);
    assert.equal(record.sha256, source.sha256, `${kind} input/export hashes agree`);
    const { page, sheet, cell, start, end } = location;
    const normalized = kind === "pdf-page"
      ? { kind, start: { page, offset: start }, end: { page, offset: end }, quote }
      : { kind, start: { sheet, cell, offset: start }, end: { sheet, cell, offset: end }, quote };
    return resolve({ ...record, location: normalized });
  } else {
    assert.fail(`Unsupported evidence location kind: ${kind}`);
  }
  assert.ok(Number.isInteger(location.start) && Number.isInteger(location.end) && location.start > 0 && location.end >= location.start, `${kind} offsets are valid integers`);
  assert.equal(location.end - location.start + 1, quote.length, `${kind} range length matches quote`);
  assert.equal(value, quote, `${kind} resolves the exact source quote`);
  return value;
}

for (const record of exported.documents) {
  await assertFresh(record);
  resolve(record);
}
for (const id of ["locations.docx", "locations.xlsx"]) {
  const encoded = await readFile(`${fixtureRoot}/${id}.b64`, "utf8");
  const actual = await readFile(`${fixtureRoot}/${id}`);
  assert.deepEqual(Buffer.from(encoded.trim(), "base64"), actual, `${id} materialized fixture matches archived fixture source`);
}

for (const id of ["locations.md", "locations.txt", "locations.js"]) {
  const record = exported.documents.find((item) => item.id === id);
  const quote = record.location.quote;
  assert.equal(record.content.split(quote).length - 1, 2, `${id} has two repeated source occurrences`);
  assert.equal(resolve(record).text.slice(record.location.start.offset - 1, record.location.end.offset), quote);
}
const docx = exported.documents.find((item) => item.id === "locations.docx");
assert.equal(docx.content.split("Exact DOCX & target").length - 1, 2);
assert.equal(resolve(docx).index, 1, "DOCX paragraph 2 citation resolves to paragraph 2, not the repeated paragraph 3");
const markdown = exported.documents.find((item) => item.id === "locations.md");
assert.throws(() => resolve({ ...markdown, location: { ...markdown.location, end: { ...markdown.location.end, line: 2 } } }), /cannot end on another/);
assert.throws(() => resolve({ ...markdown, location: { ...markdown.location, start: { ...markdown.location.start, offset: 1.5 } } }), /positive integer/);
assert.throws(() => resolve({ ...markdown, location: { ...markdown.location, end: { ...markdown.location.end, offset: 0 } } }), /positive integer/);

// The same predicate catches an edited source when its extraction export is stale.
await assert.rejects(assertFresh({ ...exported.documents[0], sha256: "0".repeat(64) }), /regenerate evidence/);

const evaluation = JSON.parse(await readFile(`${fixtureRoot}/../evaluation/manifest.json`, "utf8"));
assert.equal(evaluation.frozenBeforePromptTuning, true);
assert.deepEqual(evaluation.cases.map(({ id }) => id), ["R01","R02","R03","R04","R05","R06","R07","R08","R09","R10","C01","C02","C03","C04","D01","D02","A01","A02","A03","A04"]);
assert.equal(evaluation.cases.length, evaluation.thresholds.total);
for (const [sourceId, source] of Object.entries(evaluation.sources)) {
  const bytes = source.file ? await readFile(`${fixtureRoot}/${source.file}`) : Buffer.from(source.text, "utf8");
  assert.equal(sha256(bytes), source.sha256, `${sourceId} frozen source hash`);
}
for (const item of evaluation.cases) {
  assert.ok(item.question && item.space && item.selected.length && item.criteria, `${item.id} frozen inputs and criterion`);
  for (const selected of item.selected) {
    const [file, version] = selected.split("@");
    assert.ok(Object.values(evaluation.sources).some((source) => source.id === file && source.version === (version ?? "1") && (!source.space || source.space === item.space)), `${item.id} selected source ${selected} exists in this space/version`);
  }
  for (const evidence of item.evidence ?? []) {
    assert.equal(typeof evidence, "object", `${item.id} evidence has a coordinate, not only a source ID`);
    const source = evaluation.sources[evidence.source];
    assert.ok(source && item.selected.includes(`${source.id}@${source.version}`) || source && item.selected.includes(source.id), `${item.id} evidence source is selected`);
    assert.ok(evidence.location && evidence.location.quote, `${item.id} evidence has exact quote and location`);
    resolveManifestEvidence(source, evidence.location);
  }
  for (const excluded of item.excluded ?? []) {
    const source = evaluation.sources[excluded.source];
    assert.ok(source, `${item.id} excluded source is explicit`);
    assert.equal(source.version, excluded.version);
    assert.equal(source.status, excluded.status);
    assert.equal(source.space ?? item.space, excluded.space);
    assert.ok(excluded.location?.quote, `${item.id} excluded source has resolvable evidence coordinate`);
    assert.equal(excluded.location.kind, "line", `${item.id} excluded text fixture uses line coordinates`);
    const sourceLine = source.text.split("\n")[excluded.location.line - 1];
    assert.equal(sourceLine.slice(excluded.location.start - 1, excluded.location.end), excluded.location.quote, `${item.id} exact excluded citation`);
  }
}
assert.deepEqual(evaluation.cases.find(({ id }) => id === "R03").selected, ["r01.txt", "r02.md"]);
assert.deepEqual(evaluation.cases.find(({ id }) => id === "R09").turns.map(({ language }) => language), ["en", "en"]);
assert.equal(evaluation.sources.A04selected.text, "Recovery phrase is stored in the authorized offline binder.");
assert.equal(evaluation.sources.A04.text, "Recovery phrase is amber river 42.");
const a04 = evaluation.cases.find(({ id }) => id === "A04");
assert.deepEqual(a04.selected, ["empty-space-A.txt"]);
assert.deepEqual(a04.evidence, [], "A04 is a real abstention because selected A source contains no phrase value");
assert.match(a04.criteria, /abstain/);
const r05 = evaluation.cases.find(({ id }) => id === "R05").evidence[0];
const r06 = evaluation.cases.find(({ id }) => id === "R06").evidence[0];
assert.equal(resolveManifestEvidence(evaluation.sources.R05, r05.location), "10");
assert.equal(resolveManifestEvidence(evaluation.sources.R06, r06.location), "40");
assert.throws(() => resolveManifestEvidence(evaluation.sources.R05, { ...r05.location, path: "nonexistent.path" }), /JSON path segment nonexistent exists/);
assert.throws(() => resolveManifestEvidence(evaluation.sources.R06, { ...r06.location, row: 999 }), /CSV row 999 exists/);
assert.throws(() => resolveManifestEvidence(evaluation.sources.R05, { ...r05.location, kind: "future-kind" }), /Unsupported evidence location kind/);
console.log("OK: 8 BoxLang-exported source hashes/coordinates; DOCX repeated paragraph; stale-export and range guards; JSON/CSV exact citations and invalid-path/row/kind negatives; 20 frozen cases");
