# Role B — Knowledge core

Use after the [shared preamble](../shared-preamble.md).

Your role: B — knowledge core (Pure BoxLang + BoxLang AI). You own extraction, chunking, embeddings, retrieval, answers, citations, contradictions, relations, the AI budget and the evaluation suite. The core must stay callable without HTTP or Next.js.

## Phase 02 — tasks 02.7–02.8

Budget ledger recording operation, model, estimate, reservation, usage, cost and result; atomic reservation before every provider call; reconciliation of confirmed usage; conservative handling when the provider may have consumed without reporting; recovery of orphan reservations with no double spend. Use provider doubles; do not spend real money to test the USD 20 limit.

Tests: P02.6, P02.7.

## Phase 03 — tasks 03.1–03.6, 03.9

- Notes and TXT extraction with stable lines or fragment identifiers.
- Chunking that keeps source location, computed from content and never requested from the model.
- Real embeddings through `bx-ai` into pgvector, published only when complete.
- Retrieval authorized by space and selected documents before searching, never widened when the selection has no evidence.
- Answers from `gpt-6-luna` with claims tied to retrieved fragments; IDs, support and locations validated before publishing.
- Labels: supported, inferred (with cited premises) or uncertain; abstention when evidence is missing.
- A BoxLang CLI test that runs ingestion, retrieval and answer without Next.js.

Tests: P03.1–P03.4, P03.8, P03.9, and P03.6 with A.

## Phase 04 — backend column of 04.1–04.7, plus 04.9 and 04.10

PDF pages, Markdown, JSON paths, code lines, DOCX normalized sections, CSV rows and columns, XLSX sheets and cells; structural chunking; stored representation and locations belonging to the same current revision. Deliver each format end to end with C before starting the next.

Tests: P04.1–P04.3, and P04.6 with A.

## Phase 05 — task 05.3

HTML extraction into normalized text with deterministic locations and no executable content.

Tests: P05.1 with A, P05.3 with C.

## Phase 06 — tasks 06.1–06.5

- Contextual analysis of retrieved sources: scope, dates, conditions, population.
- Conflict contract with both sides and validated citations; no automatic winner; no claim that the whole collection is conflict-free.
- Synthetic ES/EN fixtures and manifest for R01–R10, C01–C04, D01–D02 and A01–A04, fixed before tuning.
- A reproducible evaluator that stores configuration, results, citations, usage and cost.

Tests: P06.1–P06.5.

Gates: at least 18/20, zero abstention failures, zero false conflicts, every citation verifiable. Never remove a failing case to raise the score.

## Phase 07 — tasks 07.1–07.4, 07.6

Concepts with their supporting documents and fragments; similarity edges with measure and method; shared-concept edges; explicit references only when unambiguous; relation generation inside tasks and budget, including reprocessing of already indexed documents and cleanup on replace and delete.

Tests: P07.1, P07.2, P07.5.

## Phase 08 — task 08.7

Run scenarios M08.1–M08.6 under conditions fixed beforehand, keeping capacity without AI separate from real AI latency, and report failures and timeouts.

Test: P08.5.

## Phase 09 — tasks 09.3, 09.6

Real-AI regression of the 20 cases and all formats and sources, and the documented example of using the core without Next.js.

## Seams

- A calls your ingestion entry point with a stored original and an expected revision, and enforces who may call you.
- C renders your answer, citation, conflict and graph payloads exactly as the phase 00 contract defines them.
