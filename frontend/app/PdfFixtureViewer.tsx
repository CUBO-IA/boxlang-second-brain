"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import evidence from "./evidence.generated.json";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const pdfEvidence = evidence.documents.find((document) => document.id === "locations.pdf")!;
const location = pdfEvidence.location;
const pageNumber = location.start.page as number;
const quote = location.quote;
const pageText = pdfEvidence.rows.find((row) => row.key === `page${pageNumber}`)?.text ?? "";
const start = location.start.offset as number;
const end = location.end.offset as number;
const sourceCoordinatesMatch = pageText.slice(start - 1, end) === quote && end - start + 1 === quote.length;
type PageTextContent = Parameters<NonNullable<ComponentProps<typeof Page>["onGetTextSuccess"]>>[0];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function countOccurrences(value: string, target: string) {
  let count = 0;
  let offset = 0;
  while ((offset = value.indexOf(target, offset)) !== -1) {
    count++;
    offset += target.length;
  }
  return count;
}

export default function PdfFixtureViewer() {
  const viewer = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageCount, setPageCount] = useState<number>();
  const [highlightItem, setHighlightItem] = useState<number | null>(null);
  const [message, setMessage] = useState(sourceCoordinatesMatch
    ? `Abriendo PDF original · página ${pageNumber} · coordenadas verificadas`
    : "La cita no coincide con las coordenadas PDF verificadas.");

  useEffect(() => {
    const element = viewer.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.floor(entry.contentRect.width));
      setPageWidth((current) => current === width ? current : width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function onTextSuccess({ items }: PageTextContent) {
    // ponytail: unique quote in one text item; use extractor-to-PDF mapping for general citations.
    const matches = items.flatMap((item, itemIndex) => {
      if (!("str" in item) || typeof item.str !== "string") return [];
      const count = countOccurrences(item.str, quote);
      return count ? [{ itemIndex, count }] : [];
    });
    if (matches.length !== 1 || matches[0].count !== 1) {
      setHighlightItem(null);
      setMessage("No se encontró una única coincidencia del texto en la capa PDF; no se simula el resaltado.");
      return;
    }
    setHighlightItem(matches[0].itemIndex);
    setMessage(`PDF original · página ${pageNumber}/${pageCount ?? "…"} · cita enlazada a offsets ${start}–${end}`);
  }

  function renderText({ str, itemIndex }: { str: string; itemIndex: number }) {
    const match = itemIndex === highlightItem ? str.indexOf(quote) : -1;
    if (match < 0 || countOccurrences(str, quote) !== 1) return escapeHtml(str);
    const before = escapeHtml(str.slice(0, match));
    const marked = escapeHtml(quote);
    const after = escapeHtml(str.slice(match + quote.length));
    return `${before}<mark class="pdf-coordinate-highlight">${marked}</mark>${after}`;
  }

  return (
    <figure className="pdf-fixture" aria-label="Documento PDF original">
      <div className="pdf-original" data-testid="pdf-original" ref={viewer}>
        {sourceCoordinatesMatch && pageWidth > 0 ? (
          <Document
            file="/phase00/locations.pdf"
            loading={<p role="status">Abriendo PDF original…</p>}
            onLoadSuccess={({ numPages }) => {
              setPageCount(numPages);
              if (numPages < pageNumber) setMessage("El original no contiene la página citada.");
            }}
            onLoadError={() => setMessage("No se pudo abrir el PDF original del fixture.")}
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer
              onGetTextSuccess={onTextSuccess}
              customTextRenderer={renderText}
            />
          </Document>
        ) : <p role="alert">La cita no coincide con página/offset del extractor.</p>}
      </div>
      <figcaption role="status" data-testid="pdf-coordinate-status">{message}</figcaption>
    </figure>
  );
}
