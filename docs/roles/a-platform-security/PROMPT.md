# Role A — Platform and security

Use after the [shared preamble](../shared-preamble.md).

Your role: A — platform and security (BoxLang backend). You own storage, the document and task lifecycle, authorization on every resource, safe imports, and operation.

## Phase 02 — tasks 02.1–02.6

Private writable volume outside `backend/` and public routes; library records with status and current internal revision; input validation (50 MB per file, 1,000 documents per space, phase 00 limits, concurrent uploads, duplicate vs retry); persisted tasks that survive restart; publication only if document and revision are still current; deletion with recovery from partial failure. A saved file is never "available" until B's real pipeline publishes it.

Tests: P02.1–P02.5.

## Phase 03 — tasks 03.7–03.8

Conversations (author, space, messages, selection, citations), private by default; share and unshare by the author only; continuation by the author only, even if the reader is an admin. History is context, not current evidence, and citations of replaced or deleted sources are marked.

Tests: P03.5, P03.7, and P03.6 with B.

## Phase 04 — tasks 04.8, 04.11, 04.12

Detect corrupt files, type/extension mismatch and abusive compressed content, with limits on expanded content; no false success on incomplete extraction; code files are data and are never executed.

Tests: P04.4, P04.7, and P04.6 with B.

## Phase 05 — tasks 05.1, 05.2, 05.4–05.8

Safe download (allowed schemes only, no credentials in URLs, no local or private destinations, every redirect re-validated); network limits; public GitHub repo and branch with file selection; exclusion rules; quotas per accepted file; retry and manual update; per-file batch results.

Tests: P05.2, P05.4–P05.8.

## Phase 06 — P06.6

Rerun all isolation and role tests without AI and file the full report.

## Phase 07 — tasks 07.5, 07.7

Bounded graph queries (initial view, per-node expansion, search and filter over the whole authorized collection) and coherent publication, so a stale task never adds links for replaced or deleted content.

Tests: P07.4, P07.6, P07.7.

## Phase 08 — tasks 08.1–08.6

Private Compose deployment with HTTPS; secrets and a least-privilege PostgreSQL user; session and transport checks; restart recovery; backup restored in a separate environment; safe error classes and logs.

Tests: P08.1–P08.4, P08.6.

## Phase 09 — tasks 09.1, 09.2, 09.5

Fix the candidate revision, run the non-AI regression, and prove a clean install from the documentation alone.

## Seams

- You hand B a stored original, its metadata and a task for the expected revision; B returns results that you publish.
- B's budget ledger must be called inside your task flow.
- C consumes your HTTP operations for library, tasks, conversations and imports.
