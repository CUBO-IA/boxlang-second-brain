import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const evidence = JSON.parse(await readFile("frontend/app/evidence.generated.json", "utf8"));
const markdown = evidence.documents.find((document) => document.id === "locations.md");
const pdf = evidence.documents.find((document) => document.id === "locations.pdf");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

const markdownSource = await readFile("tests/fixtures/locations.md", "utf8");
const markdownAsset = await readFile("frontend/public/phase00/locations.md", "utf8");
assert.equal(markdownAsset, markdownSource, "public Markdown fixture must be the extracted source");
assert.equal(markdown.sha256, hash(await readFile("tests/fixtures/locations.md")));
assert.equal(markdown.content, markdownSource.replace(/\r?\n$/, ""), "Markdown loader coordinates must map to the rendered source");
const markdownLines = markdownAsset.split(/\r?\n/);
const mdLocation = markdown.location;
assert.equal(
  markdownLines[mdLocation.start.line - 1].slice(mdLocation.start.offset - 1, mdLocation.end.offset),
  mdLocation.quote,
  "Markdown quote must resolve using its source line and offsets"
);
assert.equal(markdownLines.filter((line) => line === mdLocation.quote).length, 2, "fixture must retain the repeated quote");

const pdfSource = await readFile("tests/fixtures/locations.pdf");
const pdfAsset = await readFile("frontend/public/phase00/locations.pdf");
assert.deepEqual(pdfAsset, pdfSource, "public PDF must be the original synthetic source");
assert.equal(pdf.sha256, hash(pdfSource));
const pdfPage = pdf.rows.find((row) => row.key === `page${pdf.location.start.page}`)?.text;
assert.equal(pdf.location.start.page, 2, "PDF viability fixture intentionally targets non-initial page 2");
assert.equal(pdfPage.slice(pdf.location.start.offset - 1, pdf.location.end.offset), pdf.location.quote);

console.log("OK: fixed public PDF/Markdown assets match source hashes; repeated Markdown and PDF page-2 citations resolve from source coordinates");
