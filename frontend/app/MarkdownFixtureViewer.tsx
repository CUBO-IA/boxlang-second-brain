"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import evidence from "./evidence.generated.json";

type NodePosition = { start: { line: number; column: number; offset: number }; end: { line: number; column: number; offset: number } };
type MarkdownNode = { type: string; value?: string; position?: NodePosition; children?: MarkdownNode[] };
type Citation = { line: number; start: number; end: number; quote: string };

const markdownEvidence = evidence.documents.find((document) => document.id === "locations.md")!;
const location = markdownEvidence.location;
const citation: Citation = {
  line: location.start.line as number,
  start: location.start.offset as number,
  end: location.end.offset as number,
  quote: location.quote,
};

function highlightSourceCoordinate(target: Citation, source: string) {
  // ponytail: flat fixture offsets only; use a stored normalization map for arbitrary Markdown.
  const lines = source.split("\n");
  const sourceStart = lines.slice(0, target.line - 1).reduce((offset, line) => offset + line.length + 1, 0) + target.start - 1;
  const sourceEnd = sourceStart + target.end - target.start + 1;
  return function plugin() {
    return function transformer(tree: MarkdownNode) {
      let matches = 0;
      function visit(parent: MarkdownNode) {
        const children = parent.children ?? [];
        for (let index = 0; index < children.length; index++) {
          const node = children[index];
          const position = node.position;
          if (node.type === "text" && typeof node.value === "string" && position
            && position.start.offset <= sourceStart && position.end.offset >= sourceEnd) {
            const start = sourceStart - position.start.offset;
            const length = target.end - target.start + 1;
            if (start >= 0 && node.value.slice(start, start + length) === target.quote) {
              const replacement: MarkdownNode[] = [];
              if (start) replacement.push({ type: "text", value: node.value.slice(0, start) });
              replacement.push({ type: "strong", children: [{ type: "text", value: target.quote }] });
              const after = node.value.slice(start + length);
              if (after) replacement.push({ type: "text", value: after });
              children.splice(index, 1, ...replacement);
              matches++;
              index += replacement.length - 1;
              continue;
            }
          }
          visit(node);
        }
      }
      visit(tree);
      if (matches !== 1) throw new Error(`Expected one Markdown highlight at line ${target.line}, found ${matches}`);
    };
  };
}

const inertComponents: Components = {
  a: ({ children }: { children?: ReactNode }) => <span data-inert-markdown-link="true">{children}</span>,
  img: ({ alt }: { alt?: string }) => <span data-inert-markdown-image="true">{alt}</span>,
  code: ({ children }: { children?: ReactNode }) => <code>{children}</code>,
};

const renderedComponents: Components = {
  ...inertComponents,
  strong: ({ children }: { children?: ReactNode }) => <mark className="markdown-coordinate-highlight" data-testid="markdown-coordinate-highlight">{children}</mark>,
};

const safetyFixture = [
  "<script>window.__phase00MarkdownUnsafe = true</script>",
  "[unsafe link](javascript:alert(1)) ![external image](https://invalid.example/pixel.png)",
  "```html\n<script>window.__phase00CodeRan = true</script>\n```",
].join("\n\n");

export default function MarkdownFixtureViewer() {
  const [source, setSource] = useState<string>();
  const [failed, setFailed] = useState(false);
  const plugins = useMemo(() => source ? [highlightSourceCoordinate(citation, source)] : [], [source]);
  const sourceLine = source?.split(/\r?\n/)[citation.line - 1] ?? "";
  const coordinatesMatch = sourceLine.slice(citation.start - 1, citation.end) === citation.quote;

  useEffect(() => {
    let current = true;
    fetch("/phase00/locations.md", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("fixture unavailable");
        return response.text();
      })
      .then((markdown) => { if (current) setSource(markdown); })
      .catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, []);

  return (
    <section className="markdown-fixture" aria-label="Markdown renderizado desde fixture fijo">
      {!source && !failed && <p role="status">Cargando fixture Markdown…</p>}
      {failed && <p role="alert">No se pudo abrir el fixture Markdown fijo.</p>}
      {source && !coordinatesMatch && <p role="alert">La cita no coincide con la línea y offsets fuente.</p>}
      {source && coordinatesMatch && (
        <>
          <p role="status" data-testid="markdown-coordinate-status">Cita verificada por coordenadas: línea {citation.line}, offsets {citation.start}–{citation.end}</p>
          <article className="markdown-rendered" aria-label="Markdown renderizado">
            <ReactMarkdown skipHtml urlTransform={() => ""} remarkPlugins={plugins} components={renderedComponents}>
              {source}
            </ReactMarkdown>
          </article>
          <details className="markdown-safety">
            <summary>Comprobación negativa de HTML, enlaces, imágenes y código</summary>
            <div data-testid="markdown-safety-fixture">
              <ReactMarkdown skipHtml urlTransform={() => ""} components={inertComponents}>
                {safetyFixture}
              </ReactMarkdown>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
