# Role B progress — budget and knowledge core

Date: 2026-10-11. Phase 00 is **Verificada** ([phase00-closure.md](phase00-closure.md)). Role B continues on phase 02.7–02.8 and phase 03 core seams without claiming full phase closure (Role A library/tasks and Role C UI still required).

## Delivered

| Item | Status |
|---|---|
| 02.7 Budget ledger + atomic reserve | Implemented (`BudgetService`, migration `002`) |
| 02.8 Conciliation / unknown retain / orphan recovery | Implemented |
| P02.6 / P02.7 with provider doubles | `tests/budget-p02.bxs` |
| 03.1 Notes/TXT extraction + stable line ids | `TextNoteExtractor`, `KnowledgeCore.upsertNote` |
| 03.2 Chunking with locations | `TextChunker` |
| 03.3 Index publish only when embeddings complete | `KnowledgeIndex` + budget-gated embed |
| 03.4 Authorized retrieval (space + selection, no widen) | SQL `<=>` filters |
| 03.5–03.6 Claims/labels/citation validation | `AnswerService` (supported/inferred/uncertain/abstain) |
| 03.9 CLI without Next.js | `tests/knowledge-core-cli.bxs`, `tests/knowledge-p03.bxs` |
| P03.2, P03.3, P03.4, P03.6, P03.8 (doubles) | `tests/knowledge-p03.bxs` |

## Explicit non-claims

- Phase 02 is **not Verificada** (A: 02.1–02.6 library/tasks; C: library UI).
- Phase 03 is **not Verificada** (A: 03.7–03.8 conversations; C: chat/viewers; real OpenAI path not certified here).
- Provider doubles only unless an authorized paid run is requested.
- `bx-ai` `findSimilar` scientific parse residue remains; retrieval uses SQL.

## Commands

```bash
docker compose exec boxlang boxlang backend/migrations/migrate.bxs
docker compose exec boxlang boxlang tests/smoke.bxs
docker compose exec boxlang boxlang tests/budget-p02.bxs
docker compose exec boxlang boxlang tests/knowledge-core-cli.bxs
docker compose exec boxlang boxlang tests/knowledge-p03.bxs
```
