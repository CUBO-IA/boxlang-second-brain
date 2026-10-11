"use client";

import { useState } from "react";

import evidence from "./evidence.generated.json";

const documents = evidence.documents;
const graph: Record<string, string[]> = {
  document: ["policy", "limits", "owner"], policy: ["approval", "retention"], limits: ["travel", "meals", "approval"],
  owner: ["team"], approval: ["team"], retention: ["archive"], travel: [], meals: [], team: ["archive"], archive: [],
};
const nodeLimit = 8;

function renderedContent(document: (typeof documents)[number]) {
  const location = document.location;
  let lines = document.content.split("\n");
  let lineIndex: number;
  let start: number;
  let end: number;
  if (location.kind === "line") {
    lineIndex = (location.start.line as number) - 1; start = location.start.offset as number; end = location.end.offset as number;
  } else if (location.kind === "docx-paragraph") {
    lineIndex = (location.start.paragraph as number) - 1; start = location.start.offset as number; end = location.end.offset as number;
  } else if (location.kind === "pdf-page") {
    lineIndex = (location.start.page as number) - 1; start = location.start.offset as number; end = location.end.offset as number;
  } else if (location.kind === "json-path") {
    lineIndex = document.rows.findIndex((row: { key: string }) => row.key === location.start.path);
    start = location.start.offset as number; end = location.end.offset as number;
  } else if (location.kind === "csv-cell" || location.kind === "xlsx-cell") {
    const rowKey = location.kind === "csv-cell" ? `row${location.start.row}:${location.start.column}` : `${location.start.sheet}!${location.start.cell}`;
    lineIndex = document.rows.findIndex((row: { key: string }) => row.key === rowKey);
    start = location.start.offset as number; end = location.end.offset as number;
  } else throw new Error(`Unsupported evidence location ${location.kind}`);
  if (location.kind === "pdf-page") lineIndex = document.rows.findIndex((row: { key: string }) => row.key === `page${location.start.page}`);
  if (location.kind === "docx-paragraph") lineIndex = document.rows.findIndex((row: { key: string }) => row.key === `paragraph${location.start.paragraph}`);
  if (lineIndex < 0 || !Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) throw new Error(`Invalid exported coordinates for ${document.id}`);
  if (document.rows.length) {
    lines = document.rows.map((row: { key: string; text: string }) => `${row.key} = ${row.text}`);
    const prefix = `${document.rows[lineIndex].key} = `;
    const valueStart = prefix.length + start - 1;
    lines[lineIndex] = `${lines[lineIndex].slice(0, valueStart)}⟦${lines[lineIndex].slice(valueStart, valueStart + end - start + 1)}⟧${lines[lineIndex].slice(valueStart + end - start + 1)}`;
  } else {
    lines[lineIndex] = `${lines[lineIndex].slice(0, start - 1)}⟦${lines[lineIndex].slice(start - 1, end)}⟧${lines[lineIndex].slice(end)}`;
  }
  return lines.join("\n");
}

export default function Feasibility() {
  const [selected, setSelected] = useState(documents[0].id);
  const [expanded, setExpanded] = useState<string[]>(["document"]);
  const document = documents.find((item) => item.id === selected)!;
  const visibleNodes = [...new Set([...expanded, ...expanded.flatMap((node) => graph[node] ?? [])])];
  const sourceByNode = (node: string) => expanded.find((parent) => (graph[parent] ?? []).includes(node));
  const canExpand = (node: string) => {
    const next = new Set([...expanded, node, ...[...expanded, node].flatMap((parent) => graph[parent] ?? [])]);
    return !expanded.includes(node) && next.size <= nodeLimit;
  };

  function expand(node: string) {
    setExpanded((current) => {
      const nextExpanded = current.includes(node) ? current : [...current, node];
      const nextVisible = new Set([...nextExpanded, ...nextExpanded.flatMap((parent) => graph[parent] ?? [])]);
      return nextVisible.size <= nodeLimit ? nextExpanded : current;
    });
  }

  return (
    <section className="feasibility" aria-label="Pruebas de ubicación y grafo">
      <article className="viewer">
        <div className="panel-heading"><p className="eyebrow">Navegación de evidencia</p><span>extracción BoxLang congelada · SHA-256</span></div>
        <label htmlFor="fixture">Formato de documento</label>
        <select id="fixture" value={selected} onChange={(event) => setSelected(event.target.value)}>
          {documents.map((item) => <option key={item.id} value={item.id}>{item.format}</option>)}
        </select>
        <p className="location-chip">{document.locationLabel} · v{document.version} · {document.sha256.slice(0, 12)}</p>
        <pre aria-label={`${document.format} con cita resaltada`}><code>{renderedContent(document)}</code></pre>
        <p className="citation">Cita exacta: “{document.location.quote}” <span>· {document.format}</span></p>
      </article>
      <article className="graph-panel">
        <div className="panel-heading"><p className="eyebrow">Grafo de prueba</p><span>tope: 8 nodos</span></div>
        <p className="graph-root">Colección sintética</p>
        <ul aria-label="Nodos relacionados">
          {visibleNodes.map((node) => <li key={node}><span>{node}</span>{(graph[node] ?? []).length > 0 && !expanded.includes(node) && <button type="button" onClick={() => expand(node)} aria-label={`Expandir ${node}`} disabled={!canExpand(node)}>Expandir</button>}<small>{node === "document" ? "raíz" : `desde ${sourceByNode(node)}`}</small></li>)}
        </ul>
        <p role="status">{visibleNodes.length}/{nodeLimit} nodos visibles{visibleNodes.length >= nodeLimit ? " · límite alcanzado" : ""}</p>
      </article>
    </section>
  );
}
