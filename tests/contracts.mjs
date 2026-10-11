import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { documents } = JSON.parse(await readFile("/tests/fixtures/locations.json", "utf8"));
assert.equal(documents.length, 8);
function resolve(doc, location) {
  const { kind, start, end, quote } = location;
  let actual;
  if (kind === "line" || kind === "docx-paragraph") {
    const source = kind === "line" ? doc.text.split("\n")[start.line - 1] : doc.text.split("\n")[start.paragraph - 1];
    assert.ok(source && start.offset > 0 && end.offset >= start.offset, "valid line/paragraph range");
    actual = source.slice(start.offset - 1, end.offset);
  } else if (kind === "json-path") {
    actual = start.path.split(".").reduce((value, part) => value[part], JSON.parse(doc.text));
    assert.equal(start.path, end.path);
  } else if (kind === "csv-cell") {
    const rows = doc.text.split("\n").map((row) => row.split(","));
    actual = rows[start.row - 1][rows[0].indexOf(start.column)];
    assert.equal(start.row, end.row); assert.equal(start.column, end.column);
  } else if (kind === "xlsx-cell") {
    const values = { "Limits!B2": "250" };
    actual = values[`${start.sheet}!${start.cell}`];
    assert.equal(start.sheet, end.sheet); assert.equal(start.cell, end.cell);
  } else if (kind === "pdf-page") {
    const pages = doc.text.split("\n");
    actual = pages[start.page - 1];
    assert.equal(start.page, end.page);
  } else throw new Error(`unsupported location kind ${kind}`);
  assert.equal(String(actual), quote, `${doc.id} resolves exact citation`);
}
for (const doc of documents) resolve(doc, doc.location);
const evaluation = JSON.parse(await readFile("/tests/evaluation/manifest.json", "utf8"));
assert.equal(evaluation.frozenBeforePromptTuning, true);
assert.deepEqual(evaluation.cases.map(({ id }) => id), ["R01","R02","R03","R04","R05","R06","R07","R08","R09","R10","C01","C02","C03","C04","D01","D02","A01","A02","A03","A04"]);
assert.equal(evaluation.cases.length, evaluation.thresholds.total);
assert.ok(evaluation.cases.every((item) => item.question && item.space && item.selected.length && item.criteria));
for (const item of evaluation.cases) {
  for (const selected of item.selected) {
    const file = selected.replace(/@\d+$/, "");
    assert.ok(Object.values(evaluation.sources).some((source) => source.id === file && (!source.space || source.space === item.space)), `${item.id} selected source ${file} exists in this space`);
  }
  for (const id of (Array.isArray(item.evidence) ? item.evidence : [])) {
    const sourceId = typeof id === "string" ? id : id.source;
    const source = evaluation.sources[sourceId];
    assert.ok(source, `${item.id} evidence source ${sourceId} frozen`);
    if (typeof id === "object") {
      const { kind, quote } = id.location;
      let actual;
      if (kind === "line") {
        const line = source.text.split("\n")[id.location.line - 1];
        assert.equal(id.location.end - id.location.start + 1, quote.length, `${item.id} citation offsets exact`);
        actual = line.slice(id.location.start - 1, id.location.end);
      } else if (kind === "pdf-page") actual = source.pages[id.location.page - 1];
      else if (kind === "json-path") actual = id.location.path.split(".").reduce((value, part) => value[part], JSON.parse(source.text));
      else if (kind === "csv-cell") {
        const rows = source.text.split("\n").map((row) => row.split(","));
        actual = rows[id.location.row - 1][rows[0].indexOf(id.location.column)];
      } else if (kind === "xlsx-cell") actual = source.sheets[id.location.sheet].match(new RegExp(`${id.location.cell}=(.+)`))[1];
      else throw new Error(`${item.id} unsupported frozen evidence kind ${kind}`);
      assert.equal(String(actual), quote, `${item.id} source ${sourceId} exact evidence location`);
    }
  }
}
for (const [id, file] of [["md-1", "locations.md"], ["txt-1", "locations.txt"], ["json-1", "locations.jsondata"], ["code-1", "locations.js"], ["csv-1", "locations.csv"]]) {
  const actual = await readFile(`/tests/fixtures/${file}`, "utf8");
  assert.equal(actual.trimEnd(), documents.find((doc) => doc.id === id).text, `${file} bytes/content match location fixture`);
}
const repeated = documents.find((doc) => doc.id === "md-1");
assert.equal(repeated.text.split("repeat phrase").length - 1, 2);
resolve(repeated, repeated.location);
assert.throws(() => resolve(repeated, { ...repeated.location, start: { line: -1, offset: 1 } }));
assert.throws(() => resolve(repeated, { ...repeated.location, end: { line: 2, offset: 1 } }));
console.log("OK: eight format coordinate mappings resolve exact source quotes; repeated occurrence and invalid ranges checked");
