# Task 1 report — phase03 backend pipeline

**Status:** DONE_WITH_CONCERNS

## Implemented

- `backend/secondBrain/LibraryTaskWorker.bx` and `backend/library-worker.bxs`: bounded reusable worker/CLI. Claims existing 60-second leases, heartbeats around extraction loops and provider calls, strictly checks stored UTF-8/hash, rejects non-TXT/non-note formats, stages budget-gated embeddings, then publishes through the fenced `LibraryService.publishTask` transaction.
- `LibraryService`: `createNote`, `updateNote`, and `getTextContent`; notes use the existing original/version/idempotency/task records and `note` provenance. The viewer response contains normalized text, revision and stable lines, never a disk path. Note writes require write authorization and updates must target notes.
- `KnowledgeIndex`: idempotent revision-scoped fragment staging, incomplete-embedding resume, candidate/deletion guards, current-revision retrieval, citation metadata from version storage, and revision-only cleanup. Existing current evidence is retained until the candidate's atomic publish.
- `Application.bx`, `api/library.bxm`, and `library-maintenance.bxs` use the derived-evidence cleanup callback for recovery. No migration or dependency was needed.
- `KnowledgeCore` now requires explicit provider injection for tests or `P00_ALLOW_PROVIDER_CALLS=YES` plus `OPENAI_API_KEY`; otherwise it constructs the configured real `OpenAIProvider`, never `ProviderDouble`. Models remain `gpt-6-luna` and `text-embedding-3-small` (1,536 dimensions), with all calls budget-gated.
- `AnswerService` parses model JSON claims only; invalid JSON, labels, citations, empty claims, or missing inferred premises safely abstain/fail. Answer text is assembled from validated claims; citations are derived from current retrieved storage rows. The prompt treats evidence as untrusted, disallows tools/secrets, and requests cross-language answers or explicit abstention.
- Updated the injected provider double and affected tests to the structured-output/1,536-vector contract. Added `tests/pipeline-p03.bxs` for durable TXT/note creation/update, strict UTF-8/newlines, staged failure and retry, cleanup/fences, structured validation, unsupported formats, and provider default behavior.

## Commits

- `08fa640` — Connect durable library tasks and structured evidence answers
- `6577409` — Document bounded evidence context limit

## Verification

All commands ran through the isolated wrapper in `/tmp/opencode/second-brain-phase03` (project `second-brain-phase03`; no original Compose project/database touched).

| Command | Output |
|---|---|
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang backend/migrations/migrate.bxs` | `Applied migration 1 from 001_accounts.sql`<br>`Applied migration 2 from 002_library.sql`<br>`Applied migration 3 from 003_budget_and_knowledge.sql` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang tests/smoke.bxs` | `OK: Second Brain, BoxLang AI, PostgreSQL y pgvector disponibles.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/pipeline-p03.bxs` | `OK: durable notes/TXT pipeline; normalized UTF-8; partial/retry staging; lease/candidate/delete fences; structured validation; provider default` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_RUN=task1-final-9d0c boxlang boxlang tests/phase02-core.bxs` | `OK P02.1–P02.5 / V03,V05–V08,V16,V18: private files, replay/duplicate, recovery, leases, synthetic publication fence, replacement, partial delete, size boundary. No AI/indexing certified.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-p03.bxs` | `OK: P03.2/P03.3/P03.4/P03.6/P03.8/P03.9 Role B core checks with doubles.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-core-cli.bxs` | `OK: Knowledge core CLI ingest/retrieve/answer with doubles; selection not widened; invalid citations rejected.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/budget-p02.bxs` | `OK P02.6: two simultaneous budget-gated calls, one denial, exactly one provider invocation.`<br>`OK: P02.6 atomic denial without provider call; P02.7 settle/timeout/orphan without double spend.`<br>`OK V17: conservative input/output bounds, missing/invalid usage retained, confirmed overrun fully counted.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang tests/provider-validation.bxs` | `OK: pure synthetic provider validation rejects invalid chat/model/usage/budget before continuation; valid responses yield logical-only summary` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang tests/extraction.bxs` | `OK: MD=bx-ai MarkdownLoader; TXT/code=bx-ai TextLoader; JSON=bx-ai JSONLoader; CSV=bx-ai CSVLoader; PDF=bx-ai PDFLoader + PDFBox page 2 exact citation; DOCX=secure XML tree; escaped ampersand decoded; ordered runs and paragraph 2 citation exact; XLSX=secure XML tree; Summary first/distractor 999, Limits second/target 250; shared-string entities decoded; XLSX inline rich-text runs concatenate to literal A & B through full ZIP extraction; XLSX rejects unsupported cell type before reading its <v> value; XLSX rejects B0, missing cell refs, fractional/out-of-range shared indices and unsupported formulas` (fixture parser diagnostics were emitted; test exited successfully). |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P00_ALLOW_PROVIDER_CALLS=YES -e OPENAI_API_KEY=not-used -e P03_TASK_ID=00000000-0000-0000-0000-000000000000 -e P03_MAX_TASKS=1 boxlang boxlang backend/library-worker.bxs` | `{"results":[],"processed":0}` (explicit nonexistent task; provider was not called). |
| `curl -fsS http://127.0.0.1:8085/api/health.bxm` | `{"backend":"BoxLang","status":"ok"}` |
| `git diff --check` | Passed; no output. |

## Self-review and concerns

- No paid/provider calls were made. The deterministic injected provider exercises the complete indexing and answer pipeline; a live OpenAI response remains intentionally unverified.
- Retrieval supplies the top three vector matches so serialized evidence stays within the existing 32 KB chat-input bound. Raise this only after adding byte-budgeted context packing.
- Later-phase formats such as Markdown remain accepted as originals but fail their task as `unsupported_format`; they never become indexed/available. HTTP note/viewer and conversation/UI wiring remain task 2 scope.
- No new dependencies, runtimes, global installs, credentials, or schema changes.
