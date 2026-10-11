# Task 2 report — conversations, safe history and knowledge API

**Status:** DONE_WITH_CONCERNS

## Commits

- Implementation: `02a2de8ca162fbafdd195fcfd2e3b3df40fbaf7d` — Add safe persistent conversations and knowledge API.
- This report is committed separately so the implementation commit ID is included here.
- No merge or push performed.

## Implemented

- Added migration `004_conversations.sql`: private-by-default conversations, ordered user/assistant messages, state/pending fences, and historical citation snapshots. Citation document/revision IDs intentionally have no FK so replacement/deletion preserves authorized history.
- Added reusable `secondBrain.ConversationService`; it owns no HTTP state and uses the injected `KnowledgeCore` only when explicitly supplied by tests. Production creates the normal provider-gated core. Turn reservation and publication are short transactions; provider work runs without database/space locks. Publication rechecks session, membership, author, turn fence, and current selected revisions; membership and document rows are fenced during final commit.
- Extended `KnowledgeCore.ask(spaceId, selectedDocumentIds, question, safeHistoryQuestions=[])`. It sends bounded prior user questions as explicitly untrusted context to the prompt and retrieval embedding. History is up to six questions/4,096 UTF-8 bytes. Answers, claims, citations, and excerpts are never loaded into history. Serialized embedding/chat requests stay within existing caller limits; evidence is removed from the tail or the core safely abstains if necessary.
- Added `backend/api/knowledge.bxm`, a thin JSON adapter for task1 notes/current source and conversation operations. It applies no-store/nosniff headers, validates cookie/body bounds and JSON objects, forwards Origin/CSRF, maps task1 `LibraryService` fields, and never exposes provider injection.
- Added a 1 MiB UTF-8 note body bound before and after normalization in `LibraryService`. HTTP raw-body bounds are 1,100,000 bytes for note operations and 32,768 bytes otherwise.
- Added deterministic PostgreSQL/service suite `tests/conversation-p03.bxs` and direct HTTP-boundary check `tests/knowledge-http-p03.sh`.

## Exact API contract for task 3

Base URL: `/api/knowledge.bxm?op={operation}`. JSON is UTF-8. Every response has `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`. The unique `sb_session` cookie is limited to 4,096 bytes. GET operations do not require CSRF; POST/PUT operations require exact configured `Origin` and `X-CSRF-Token`.

### Operations

| Operation | Method and query parameters | JSON body | Success |
|---|---|---|---|
| `createNote` | POST, `spaceId` | `{ "title": string, "body": string, "operationKey": string }` | 202 `{ "note": { "documentId", "versionId", "taskId", "status" } }` |
| `updateNote` | PUT, `spaceId`, `documentId` | Same as `createNote` | 202, same `note` shape |
| `source` | GET, `spaceId`, `documentId` | none | 200 `{ "source": { "documentId", "revisionId", "title", "kind", "content", "lines", "lineCount", "provenance" } }` |
| `listConversations` | GET, `spaceId`, optional `offset` and `limit` | none | 200 `{ "conversations": [...], "offset", "limit", "hasMore" }` |
| `createConversation` | POST, `spaceId` | `{}` | 201 `{ "conversation": { "id", "spaceId", "authorId", "shared": false, "canContinue": true } }` |
| `readConversation` | GET, `conversationId`, optional `afterSequence` and `limit` | none | 200 `{ "conversation", "messages", "nextAfter", "hasMore" }` |
| `sendMessage` | POST, `conversationId` | `{ "question": string, "scope": {"mode":"space"} }` or `{ "question": string, "scope": {"mode":"documents", "documentIds":[UUID,...]} }` | 200 `{ "conversation", "userMessage", "assistantMessage" }` |
| `shareConversation` | POST, `conversationId` | `{}` | 200 `{ "conversation": { "id", "shared": true } }` |
| `unshareConversation` | POST, `conversationId` | `{}` | 200 `{ "conversation": { "id", "shared": false } }` |
| `resolveCitation` | GET, `conversationId`, `messageId`, `citationId` | none | 200 `{ "citation", "source"? }`; `source` only for `status: "current"` |

Conversation list entries are `{id,spaceId,authorId,shared,canContinue,createdAt,updatedAt}`. A user message is `{id,sequence,role:"user",content,scope:{mode,documentIds},createdAt}`. An assistant message is `{id,sequence,role:"assistant",content,abstained,reason?,claims,citations,createdAt}`. Claims are `{text,label,premises,citationIds}` where `label` is `supported`, `inferred`, or `uncertain`; `citationIds` are persisted UUIDs, not core-local keys. Citation snapshots are `{id,documentId,revisionId,fragmentId,title,provenance,location,excerpt,claimIndex,status}`. `status` is recalculated as `current`, `replaced`, `deleted`, or `inaccessible`. Historical resolution returns source content/lines only while the exact cited revision remains current.

Task1 service mapping is deliberate: `LibraryService.createNote/updateNote` return `documentId`, `versionId`, `taskId`, and `status`; the adapter maps these to the stable note shape without changing the library service. `getTextContent` fields already match the source contract (`title`, `revisionId`, normalized `content`, `lines`, `lineCount`, `provenance`).

### Input limits and errors

- Raw JSON body: 32,768 UTF-8 bytes for non-note operations; 1,100,000 bytes for `createNote`/`updateNote`. The adapter checks declared length when present and measured UTF-8 bytes before JSON parsing.
- Note title: 1–255 characters after trim; note body: 1–1,048,576 UTF-8 bytes before and after CRLF/CR normalization and BOM removal; operation key: `[A-Za-z0-9_-]{1,100}`.
- Question: nonempty string, at most 4,096 UTF-8 bytes. `documents` scope: 1–100 distinct canonical UUIDs; `[]` is 400 and never widens. `space` resolves currently available documents only (maximum 1,000).
- Safe prior context: at most six prior user questions, 4,096 UTF-8 bytes aggregated; answer/extract/claim history is excluded.
- Conversation list: `limit` 1–50, `offset` 0–10,000. History page: `limit` 1–100, `afterSequence` >=0. IDs are UUIDs; `spaceId` is a positive decimal integer.
- Uniform error JSON: `{ "errorCategory", "category", "message" }`; messages are generic and contain no SQL, paths, prompts, credentials, or stack traces.
- Statuses: 400 malformed/type/ID/scope/selection; 401 missing/expired session; 403 invalid Origin/CSRF or denied write; 404 inaccessible space/document/conversation/citation; 405 method; 409 occupied turn/fence/revision conflict; 413 byte limit; 429 budget denial; 500 unexpected internal error; 503 provider/configuration/storage unavailable.

Task 3's Next proxy must enforce the same 32,768/1,100,000 raw request-byte limits. No frontend files were changed in task 2.

## Verification

All Compose commands used `.superpowers/sdd/03-ingesta-chat-y-evidencia/compose` (isolated project `second-brain-phase03`; `P00_ALLOW_PROVIDER_CALLS=NO`). ProviderDouble was explicitly injected by deterministic service tests; no paid calls were made.

| Command | Output |
|---|---|
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang backend/migrations/migrate.bxs` | `Migration 1 already applied`<br>`Migration 2 already applied`<br>`Migration 3 already applied`<br>`Migration 4 already applied` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang tests/smoke.bxs` | `OK: Second Brain, BoxLang AI, PostgreSQL y pgvector disponibles.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/conversation-p03.bxs` | `OK: private/shared authorization; live membership; scope isolation; safe question-only history; current/replaced/deleted citations; deterministic injected provider.` |
| `bash tests/knowledge-http-p03.sh` | `OK: BoxLang knowledge HTTP safe errors; 32,768-byte chat and 1,100,000-byte note body caps.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/pipeline-p03.bxs` | `OK: durable notes/TXT pipeline; normalized UTF-8; partial/retry staging; lease/candidate/delete fences; structured validation; provider default` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-p03.bxs` | `OK: P03.2/P03.3/P03.4/P03.6/P03.8/P03.9 Role B core checks with doubles.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-core-cli.bxs` | `OK: Knowledge core CLI ingest/retrieve/answer with doubles; selection not widened; invalid citations rejected.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang tests/provider-validation.bxs` | `OK: pure synthetic provider validation rejects invalid chat/model/usage/budget before continuation; valid responses yield logical-only summary` |
| `git diff --check` | Passed; no output. |

Direct HTTP checks also observed 400 for malformed JSON, 401 for unauthenticated conversation listing, 413 for oversized chat and note request bodies; each returned the generic error shape. These requests did not invoke the knowledge core.

## Self-review and concerns

- All provider tests were deterministic and explicitly injected. Live OpenAI behavior remains unverified and is reserved for the separately authorized final evaluation.
- Tests exercise pending-turn denial and final revision/membership fences across lifecycle operations, but do not orchestrate a true two-thread provider call racing membership removal/replacement.
- Task 3 still needs to apply the same raw body caps in its proxy. Exact values and operation contract are frozen above.
- Scope stayed backend-only; no runtime/dependency installation, credentials, merge, or push.
