# Second Brain — Role prompts (phases 02–09)

Prompts for dividing the [implementation plan](../plan/README.md) among three participants, starting at phase 02. They organize work; they do not authorize a phase or record anything as implemented.

## How to use

Each participant gives their coding agent two files, in this order:

1. [shared-preamble.md](shared-preamble.md) — context and rules common to everyone.
2. The `PROMPT.md` of their role folder.

| Role | Folder | Owns |
|---|---|---|
| A — Platform and security | [a-platform-security/](a-platform-security/PROMPT.md) | Storage, document and task lifecycle, authorization, safe imports, operation |
| B — Knowledge core | [b-knowledge-core/](b-knowledge-core/PROMPT.md) | Extraction, embeddings, retrieval, answers, citations, contradictions, relations, AI budget, evaluation |
| C — Web | [c-web/](c-web/PROMPT.md) | Everything in `frontend/` |

## Before starting

- Phases 00 and 01 must be marked "Verificada" in the [plan index](../plan/README.md) with a closure record. The prompts tell each agent to stop if they are not.
- The plan is sequential: close one phase before the next. The split is therefore by layer inside each phase, not one phase per person.

## Task split

Task IDs refer to the phase files in [docs/plan/](../plan/README.md).

| Phase | A — Platform and security | B — Knowledge core | C — Web |
|---|---|---|---|
| 02 Library, tasks, budget | 02.1–02.6 | 02.7–02.8 | Library UI |
| 03 Ingestion, chat, evidence | 03.7–03.8 | 03.1–03.6, 03.9 | Notes, chat, two viewers |
| 04 Formats and viewers | 04.8, 04.11, 04.12 | 04.1–04.7 backend, 04.9, 04.10 | Seven viewers |
| 05 URL and GitHub | 05.1, 05.2, 05.4–05.8 | 05.3 | Import UI |
| 06 Contradictions, evaluation | P06.6 | 06.1–06.5 | Conflict UI |
| 07 Graph | 07.5, 07.7 | 07.1–07.4, 07.6 | Graph UI |
| 08 Operation | 08.1–08.6 | 08.7 | Frontend checks, P08.7 |
| 09 Acceptance | 09.1, 09.2, 09.5 | 09.3, 09.6 | 09.4, 09.7, 09.8 |

The budget (02.7–02.8) belongs to B because B's AI calls are its only consumer and phase 02 is otherwise all platform work.

## Seams

- **A → B:** a stored original, its metadata and a task for the expected revision. B returns results that A publishes.
- **B → C:** answer, citation, conflict and graph payloads, as defined by the phase 00 contract.
- **A → C:** HTTP operations for library, tasks, imports and conversations.
