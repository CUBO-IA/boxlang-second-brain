# SDD ledger — plan: docs/plan/03-ingesta-chat-y-evidencia.md

Base: d43cd4d. Branch feat/phase03-ingestion-chat, isolated worktree /tmp/opencode/second-brain-phase03. User requested implementation using openai/gpt-6-luna-fast. No prior task ledger in this worktree.

Spec authority: docs/specification/02-usuarios-y-espacios.md, 03-ingesta-y-documentos.md, 04-consultas-y-evidencia.md; phase00 defaults and verified phase02 apply.

## Preflight / task inventory

| Tasks | Producer / consumer or internal agreement | Finding |
|---|---|---|
| 1 pipeline / 2 conversations | Task1 stages and atomically publishes current revisions and validates structured claims; task2 uses current-only retrieval, citation revision/status and notes API | Preserve current revision on failed/stale work; task1 must not publish before library fence |
| 1 pipeline / 3 UI | Task1 notes, worker, normalized source; task3 note editor/viewer | API contracts fixed by task2; no business logic in Next.js |
| 1 pipeline / 4 acceptance | Task1 core/worker tests; task4 full integration and regression | Existing doubles must remain explicit and cannot count as real AI |
| 2 conversations / 3 UI | Task2 fixes safe HTTP contract; task3 proxy/UI consumes it | Private author vs read-only shared, source status and exact locations required |
| 2 conversations / 4 acceptance | Task2 deterministic security tests; task4 cross-layer verification | Test revoked membership, stale evidence, selection and author-only mutations |
| 3 UI / 4 acceptance | Task3 UI/proxy tests; task4 browser + full acceptance evidence | HTTP 200 alone does not prove highlight navigation |
| 1 internal | Existing 03.1–03.6 marked done, but core defaults to double, drops current on staging, heuristically creates claims | Ruling: complete these integration gaps as part of phase03 — required by the actual spec, not prior checkmarks — cost if wrong: additional backend changes to review |
| 2 internal | Conversation persistence, author permissions, safe history vs obsolete evidence | No contradiction; preserve historical extracts for authorized members, never re-send them as evidence |
| 3 internal | TXT/note editing, selection, chat, read-only shared, i18n and exact highlight | No new format/generic viewer framework; reuse existing layout/styles and browser primitives |
| 4 internal | P03.1 requires real calls; verification explicitly forbids unauthorized paid calls | Ruling: implement opt-in real evaluation, run deterministic tests only, do not mark phase verified without authorized real run — cost if wrong: real-provider acceptance remains pending |

## Execution

Task 1: fix round 1/5 (1 addressed, 0 open — cross-kind note/upload idempotency; commits a664916..c174cef).
Task 1: complete (commits d43cd4d..c174cef, review clean).
Task 2: fix round 1/5 (stale turn recovery and in-flight unshare test added; 1 open — upgrade with legacy pending token; commits33408bc..3844264).
Task 2: fix round 2/5 (legacy pending-token upgrade addressed, 0 open; commits3844264..0e220ca).
Task 2: complete (commits c174cef..0e220ca, review clean).
Task 3: fix round 1/5 (1 Important +2 Minor addressed, 0 open — paging/sharing authorization clears state, note busy fields protected, local proxy errors uniform; commitsfff9d7b..edae6e8).
Task 3: complete (commits0e220ca..edae6e8, review clean).
Task 4: pending — acceptance/regression checks, browser evidence, honest documentation.

Task1 reports: task-1-report.md; review task-1-review.md, fix re-review task-1-rereview.md. Reported tests all pass; current source viewer/HTTP remains task2. Existing Office extraction diagnostics noted, live provider intentionally untested so far. Task2 preparation contract is task-2-contract.md; implementer must reconcile actual task1 field names and add safe question-context seam.

Task2 reports task-2-report.md and final task-2-rereview-2.md. Added migrations004/005, question-only follow-up context, membership/revision/author fences, lease-based recovery including v4 legacy-token upgrade regression. Lifecycle barrier test covers unshare during active provider call. Actual transport contract/body caps in task2 report are binding for task3.

Task3 reports task-3-report.md, task-3-rereview.md. UI/proxy and exact codepoint-based source highlight implemented. Fixture task3-browser-01 exists with synthetic owner/reader accounts (see report) for controller browser acceptance. Old pre-offset citations fail closed without guessed highlight; new indexing stores precise offsets. tsc/lint/proxy/auth regression passed. No paid calls so far.

User subsequently requested commit all + push to main (explicit merge/push authorization). Snapshot b374be0 committed all task4 partial artifacts and accurate docs; phase En curso, real acceptance registration500 unresolved. Task4 browser/deterministic checks passed as reported; one real embedding probe reservation941 settled USD0.00000040, no real chat; daily committedUSD0.00008128 includes double baseline, default paidNO and persisted cap1 confirmed by controller.

Final-review Important and Minor findings are resolved by the final fix wave: staging preserves the published marker through atomic publish, with failed and in-flight replacement/chat regressions; malformed offset and afterSequence values reject before coercion. Verification ran only in the separate review database, paid calls disabled. Phase remains En curso pending real provider acceptance; original ledger reservation941 was not touched.

Controller checks before task completion: isolated Compose up healthy using existing images; `compose exec -T boxlang boxlang tests/smoke.bxs` PASS (Second Brain, BoxLang AI, PostgreSQL, pgvector); `compose exec -T boxlang boxlang tests/phase01-crypto.bxs` PASS (PBKDF2/600000, salt/output, constant-time comparison and token). No provider requests made. Frontend docs/Context7 retrieved for Next16 route handler async params and client lifecycle; task3 must read installed guides.

Additional baseline checks (controller, 2026-10-11): `exec -T -e P01_RUN=phase03-baseline-expiry boxlang boxlang tests/phase01-expiry.bxs` PASS; `exec -T -e P01_RUN=phase03-baseline-auth -e BOXLANG_URL=http://boxlang:8080 -e P01_FRONTEND_URL=http://127.0.0.1:3000 -e P01_ORIGIN=http://127.0.0.1:3005 frontend node /tests/phase01-http.mjs` PASS (auth/session, roles, race, revocation, CSRF/Origin, manipulated IDs); frontend `pnpm exec tsc --noEmit` and `pnpm lint` PASS; `tests/vector-roundtrip.bxs` and `tests/location.bxs` PASS. Existing `tests/extraction.bxs` assertions pass but emit pre-existing PDF fallback-font warnings and Office XML grammar messages; this does not validate later-format product integration and is not pristine output. No changes to that out-of-scope extractor in this task.

User authorization received through question tool: **Sí, máximo USD 1** for real OpenAI validation on synthetic documents. Real tests may now run in isolated project, explicitly opt-in per command; enforce a hard cumulative USD1 ceiling (including unknown retained reservations), do not erase usage between attempts and record actual usage/cost. Default server remains paid calls NO. Earlier ruling to defer real calls is superseded by this explicit authorization, not permission to leave test doubles enabled in product.

Implementation and review use Luna Fast as explicitly requested. No merges/pushes. Synthetic data in isolated Compose project second-brain-phase03 (ports 3005/8085/55438), separate volumes. Scratch compose wrapper sets paid calls NO. PostgreSQL port 55435 was already allocated, so changed scratch wrapper only to 55438.
