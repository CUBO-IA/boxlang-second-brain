"use client";

import { useEffect, useRef } from "react";
import type { Source } from "../lib/knowledge";

function codePointLength(value: string) {
  let length = 0;
  for (let index = 0; index < value.length; index++, length++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff) index++;
  }
  return length;
}

function codePointToUnit(value: string, index: number) {
  let points = 0;
  let units = 0;
  for (const point of value) {
    if (points >= index) break;
    points++;
    units += point.length;
  }
  return units;
}

export function TextSourceView({
  source,
  range,
  focusLine,
}: {
  source: Source;
  range?: { startOffset?: number; endOffset?: number };
  focusLine?: number;
}) {
  const root = useRef<HTMLOListElement>(null);
  const precise = Number.isInteger(range?.startOffset) && Number.isInteger(range?.endOffset)
    && (range?.startOffset ?? -1) >= 0 && (range?.endOffset ?? -1) >= (range?.startOffset ?? 0)
    && (range?.endOffset ?? Number.POSITIVE_INFINITY) <= codePointLength(source.content);
  const lineStarts: number[] = [];
  let cursor = 0;
  for (const line of source.lines) {
    lineStarts.push(cursor);
    cursor += codePointLength(line.text) + 1;
  }

  useEffect(() => {
    if (!focusLine || !root.current) return;
    const row = root.current.querySelector<HTMLElement>(`[data-source-line="${focusLine}"]`);
    row?.scrollIntoView({ block: "center" });
    row?.focus({ preventScroll: true });
  }, [source.revisionId, focusLine]);

  return (
    <ol className="source-lines" ref={root} aria-label={source.title}>
      {source.lines.map((line, index) => {
        const lineStart = lineStarts[index];
        const lineLength = codePointLength(line.text);
        const lineEnd = lineStart + lineLength;
        const selectedStart = precise ? Math.max(range!.startOffset!, lineStart) : lineStart;
        const selectedEnd = precise ? Math.min(range!.endOffset!, lineEnd) : lineStart;
        const selected = precise && selectedStart < selectedEnd;
        const startUnit = selected ? codePointToUnit(line.text, selectedStart - lineStart) : 0;
        const endUnit = selected ? codePointToUnit(line.text, selectedEnd - lineStart) : 0;
        return (
          <li key={line.line} data-source-line={line.line} tabIndex={-1}>
            <span className="source-line-number" aria-hidden="true">{line.line}</span>
            <code>
              {selected ? <>{line.text.slice(0, startUnit)}<mark>{line.text.slice(startUnit, endUnit)}</mark>{line.text.slice(endUnit)}</> : line.text || " "}
            </code>
          </li>
        );
      })}
    </ol>
  );
}
