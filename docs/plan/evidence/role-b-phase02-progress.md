# Role B progress — budget and knowledge core

**Subsequent integration:** phase 02 is now **Verificada**, with concurrent budget calls, actual restart recovery and real library UI checked in [phase02-closure.md](phase02-closure.md). The original role-only claims below remain historical; phase 03 is not closed.

Date: 2026-10-11. Phase 00 is **Verificada** ([phase00-closure.md](phase00-closure.md)). Role B continues on phase 02.7–02.8 and phase 03 core seams without claiming full phase closure (Role A library/tasks and Role C UI still required).

## Delivered

| Item | Status |
|---|---|
| 02.7 Budget ledger + atomic reserve | Implemented (`BudgetService`, migration `003` after integration; `002` is library) |
| 02.8 Conciliation / unknown retain / orphan recovery | Implemented |
| P02.6 / P02.7 with provider doubles | `tests/budget-p02.bxs` |
| 03.1 Notes/TXT extraction + stable line ids | `TextNoteExtractor`, `KnowledgeCore.upsertNote` |
| 03.2 Chunking with locations | `TextChunker` |
| 03.3 Index publish only when embeddings complete | `KnowledgeIndex` + budget-gated embed |
| 03.4 Authorized retrieval (space + selection, no widen) | SQL `<=>` filters |
| 03.5–03.6 Claims/labels/citation validation | `AnswerService` (supported/inferred/uncertain/abstain) |
| 03.9 CLI without Next.js | `tests/knowledge-core-cli.bxs`, `tests/knowledge-p03.bxs` |
| P03.2, P03.3, P03.4, P03.6, P03.8 (doubles) | `tests/knowledge-p03.bxs` |
| Opt-in real OpenAI adapter | `OpenAIProvider.bx` + `tests/knowledge-provider.bxs` |

## Authorized real OpenAI run (2026-10-11)

Opt-in only (`P00_ALLOW_PROVIDER_CALLS=YES` + dated Standard rates from `.env.example`). No secrets in logs/repo.

| Check | Result |
|---|---|
| `tests/provider.bxs` chat (`gpt-6-luna`) | OBSERVED — ~USD 0.0000061 |
| `tests/provider.bxs` embed (`text-embedding-3-small`, 1536-d) | OBSERVED — ~USD 0.00000012 |
| `tests/provider.bxs` bx-ai `findSimilar` roundtrip | ERROR at dim 92 (known residue; Role B uses SQL `<=>`) |
| `tests/knowledge-provider.bxs` ingest/ask/selection/absent | **PASS** — embedCalls=5, chatCalls=2, committed ≈ USD 0.000045 |

Lexical claim planning filters Spanish/English function words so absent questions abstain before chat; the chat prompt also requests `INSUFFICIENT_EVIDENCE` when evidence is insufficient.

## Explicit non-claims

- Phase 02 is **not Verificada** (A: 02.1–02.6 library/tasks; C: library UI).
- Phase 03 is **not Verificada** (A: 03.7–03.8 conversations; C: chat/viewers).
- Real OpenAI path is exercised for Role B core seams; full product acceptance still needs Roles A/C.
- `bx-ai` `findSimilar` scientific parse residue remains; retrieval uses SQL.

## Commands

**Use an isolated Compose project/database.** The double suites and real-provider probe clear today's ledger (the double knowledge suites also clear all knowledge rows); they require explicit `P02_ISOLATED_DATABASE=YES`. Do not opt in on a database containing real usage or documents.

```bash
docker compose exec boxlang boxlang backend/migrations/migrate.bxs
docker compose exec boxlang boxlang tests/smoke.bxs
docker compose exec -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/budget-p02.bxs
docker compose exec -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-core-cli.bxs
docker compose exec -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-p03.bxs
# Authorized paid run only:
# P00_ALLOW_PROVIDER_CALLS=YES docker compose exec -e P00_ALLOW_PROVIDER_CALLS=YES \
#   -e P02_ISOLATED_DATABASE=YES \
#   -e OPENAI_API_KEY -e P00_PRICE_DATE -e P00_PRICE_REFERENCE \
#   -e P00_CHAT_INPUT_USD_PER_MILLION -e P00_CHAT_OUTPUT_USD_PER_MILLION \
#   -e P00_EMBED_USD_PER_MILLION boxlang boxlang tests/knowledge-provider.bxs
```
