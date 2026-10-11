# Role C — Web

Use after the [shared preamble](../shared-preamble.md).

Your role: C — web. You own everything in `frontend/` (Next.js, TypeScript, Tailwind).

- The installed Next.js has breaking changes: read the guides in `node_modules/next/dist/docs/` before writing code.
- Follow `DESIGN.md` and use the viewer and graph libraries chosen in phase 00; do not build your own code highlighter.
- Every screen works in Spanish and English, by keyboard where applicable, with distinctions that do not rely on color alone.
- Until A and B deliver an operation, build against the agreed contract, and say so in your report.

## Phase 02 — "Frontend Next.js" list

Space library with source, format, size, status and failure information; single and multiple upload with a result per file; authorized replace, delete and retry; status changes; distinct messages for permission, limit, format, budget and provider; notice that content is sent to OpenAI and that deleting keeps past messages and possible extracts.

Browser evidence for P02.1–P02.3.

## Phase 03 — "Frontend Next.js" list

Note editor; TXT viewer with lines and normalized note viewer; chat with history, follow-up and explicit scope (whole space or chosen documents); per-claim labels, premises and citations; opening a citation at its exact location with only that evidence highlighted; own and shared conversations, read-only when not the author; replaced and deleted sources marked and never opened as current evidence.

Browser evidence for P03.1, P03.5, P03.6.

## Phase 04 — frontend column of 04.1–04.7, plus the common frontend list

PDF original with page and highlight, sanitized rendered Markdown, navigable JSON, code with line numbers, converted DOCX, CSV table, XLSX with sheet selection. Originals and representations are fetched through BoxLang authorization; no URL or cache may bypass permissions or mix revisions. Deliver each format end to end with B.

Tests: P04.2, P04.5, and P04.7 with A.

## Phase 05 — "Frontend Next.js" list

URL import explaining "one public page, no JavaScript"; GitHub import with repo, branch and file selection, showing exclusions and reasons; batch summary, per-document status, retry and manual update; provenance in library, viewer and citations.

Browser evidence for P05.1, P05.3, P05.4.

## Phase 06 — "Frontend Next.js" list

Both claims with their citations, context and explanation, with no "winning policy" ranking; navigation to each side; notice that analysis is limited to retrieved sources.

Browser evidence for P06.2, P06.5.

## Phase 07 — "Frontend Next.js" list

2D view with documents and concepts visually distinct; legend for the three edge types; zoom, pan, search, filters and progressive expansion; a visible "partial view" indication; opening a document in the existing viewers; clearing the graph on space change.

Tests: P07.3, P07.8, and P07.4 with A.

## Phase 08 — "Frontend Next.js" list

Lint and build inside Docker, full ES/EN walkthrough, keyboard and focus review, late-response and timeout behaviour.

Test: P08.7.

## Phase 09 — tasks 09.4, 09.7, 09.8

Visual verification of citations, conflicts, historical sources and graph; the delivery README; the ten-step demo script, screenshots and the Devpost submission with previous components separated from event work.

## Seams

- You call A's operations for library, tasks, imports and conversations, and render B's answer, citation, conflict and graph payloads.
- Next.js calls BoxLang server-side over the Compose network and contains no business logic or second API.
