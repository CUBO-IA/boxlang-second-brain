"use client";

import { useState } from "react";

const documents = [
  { id: "md-1", format: "Markdown", text: "Title\nrepeat phrase\nrepeat phrase", kind: "line", label: "línea 3 · repetición 2", quote: "repeat phrase", line: 3 },
  { id: "txt-1", format: "TXT", text: "Header\nExact TXT target\nExact TXT target", kind: "line", label: "línea 3 · repetición 2", quote: "Exact TXT target", line: 3 },
  { id: "json-1", format: "JSON", text: "{\n  \"policy\": { \"maxDays\": 10 },\n  \"other\": { \"maxDays\": 10 }\n}", kind: "json-path", label: "policy.maxDays", quote: "10" },
  { id: "code-1", format: "JavaScript", text: "const first = 'same';\nconst target = 'Exact CODE target';\nconst again = 'Exact CODE target';", kind: "line", label: "línea 3 · repetición 2", quote: "Exact CODE target", line: 3 },
  { id: "csv-1", format: "CSV", text: "category,limit\ntravel,250\nmeals,40", kind: "csv-cell", label: "fila 3 · columna limit", quote: "40" },
  { id: "pdf-1", format: "PDF", text: "Página 1: introducción\nPágina 2: Exact PDF target", kind: "pdf-page", label: "página 2", quote: "Exact PDF target" },
  { id: "docx-1", format: "DOCX", text: "Párrafo 1\nExact DOCX target\nExact DOCX target", kind: "docx-paragraph", label: "párrafo 2", quote: "Exact DOCX target" },
  { id: "xlsx-1", format: "XLSX", text: "Limits!A1 = category\nLimits!B2 = 250\nLimits!C3 = repeat target", kind: "xlsx-cell", label: "hoja Limits · celda B2", quote: "250" },
];

const graph = {
  document: ["policy", "limits"],
  policy: ["approval"],
  limits: ["travel", "meals"],
  approval: [], travel: [], meals: [],
};

function highlightedText(document: (typeof documents)[number]) {
  if (document.kind === "line") {
    const lines = document.text.split("\n");
    const index = document.line! - 1;
    const position = lines[index].lastIndexOf(document.quote);
    lines[index] = `${lines[index].slice(0, position)}⟦${document.quote}⟧${lines[index].slice(position + document.quote.length)}`;
    return lines.join("\n");
  }
  const index = document.kind === "json-path" ? document.text.indexOf("10") : document.kind === "csv-cell" ? document.text.lastIndexOf(document.quote) : document.text.lastIndexOf(document.quote);
  return `${document.text.slice(0, index)}⟦${document.quote}⟧${document.text.slice(index + document.quote.length)}`;
}

export default function Feasibility() {
  const [selected, setSelected] = useState(documents[0].id);
  const [expanded, setExpanded] = useState<string[]>(["document"]);
  const document = documents.find((item) => item.id === selected)!;
  const visibleNodes = expanded.flatMap((node) => graph[node as keyof typeof graph].map((child) => ({ parent: node, child }))).filter(({ child }) => !expanded.includes(child));

  function expand(node: string) {
    setExpanded((current) => current.length >= 8 || current.includes(node) ? current : [...current, node]);
  }

  return (
    <section className="feasibility" aria-label="Pruebas de ubicación y grafo">
      <article className="viewer">
        <div className="panel-heading"><p className="eyebrow">Navegación de evidencia</p><span>fixture local · vista textual, no visor nativo</span></div>
        <label htmlFor="fixture">Formato de documento</label>
        <select id="fixture" value={selected} onChange={(event) => setSelected(event.target.value)}>
          {documents.map((item) => <option key={item.id} value={item.id}>{item.format}</option>)}
        </select>
        <p className="location-chip">{document.label}</p>
        <pre aria-label={`${document.format} con cita resaltada`}><code>{highlightedText(document)}</code></pre>
        <p className="citation">Cita exacta: “{document.quote}” <span>· {document.format}</span></p>
      </article>
      <article className="graph-panel">
        <div className="panel-heading"><p className="eyebrow">Grafo de prueba</p><span>tope: 8 nodos</span></div>
        <p className="graph-root">Colección sintética</p>
        <ul aria-label="Nodos relacionados">
          {expanded.map((node) => <li key={node}><span>{node}</span></li>)}
          {visibleNodes.map(({ parent, child }) => <li key={child}><span>{child}</span><button type="button" onClick={() => expand(child)} aria-label={`Expandir ${child}`} disabled={expanded.length >= 8}>Expandir</button><small>desde {parent}</small></li>)}
        </ul>
        {expanded.length >= 8 && <p role="status">Límite de exploración alcanzado.</p>}
      </article>
    </section>
  );
}
