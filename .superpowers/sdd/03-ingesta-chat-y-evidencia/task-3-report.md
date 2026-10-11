# Task 3 report — product chat, notes and TXT/note citation viewer

**Status:** DONE_WITH_CONCERNS

## Implemented

- Extended `frontend/app/api/[...path]/route.ts` with thin `/api/knowledge.bxm` proxy operations for notes, normalized source, conversation list/create/read/send/share/unshare, and citation resolution. The proxy forwards only `sb_session`, Origin and CSRF headers; applies no-store/nosniff; validates UUID/space paths and methods; and enforces 32,768-byte JSON and 1,100,000-byte note request caps.
- Enabled Chat in `WorkspacePanel`. `ConversationPanel` shows own/shared conversations, ordered/paged history, follow-ups, role-safe sharing, whole-space or explicit available-document scope, per-question stored scope, validated claims/premises/citations, safe abstentions/errors, and a read-only view when `canContinue` is false. Empty explicit selection cannot send or widen.
- Added note create/edit with an idempotency key, UTF-8 byte count, save/error/progress feedback, role checks and pending/indexed distinctions. TXT and note current-source previews render normalized numbered lines. File replacement controls exclude notes, and `LibraryService.acceptFile` also rejects cross-kind replacement.
- Added citation resolution on click. Current source is rechecked by the resolver; historical citations show their saved excerpt and localized status only. The line renderer converts persisted zero-based, end-exclusive Unicode codepoint offsets to UTF-16 indices and marks only that span—no substring search or `dangerouslySetInnerHTML`.
- `TextChunker` now stores exact codepoint ranges and calculates line bounds from those ranges. Added `tests/chunk-offsets-p03.bxs`, `tests/phase03-frontend.mjs`, and `tests/phase03-browser-fixture.bxs` (explicit `ProviderDouble`, no HTTP provider injection).

## Commits

- Implementation: `5641280` — Add knowledge chat and source viewer.
- Report: committed separately after the implementation commit.
- No merge or push performed.

## Verification

All Compose commands used the isolated scratch wrapper; it exports `P00_ALLOW_PROVIDER_CALLS=NO`.

| Command | Output |
|---|---|
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T frontend sh -lc 'cd /app && pnpm exec tsc --noEmit'` | Passed; no output. |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T frontend sh -lc 'cd /app && pnpm lint'` | `$ eslint`; passed. |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang tests/chunk-offsets-p03.bxs` | `OK: exact end-exclusive Unicode codepoint ranges select the proper repeated phrase across chunks and lines.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/pipeline-p03.bxs` | `OK: durable notes/TXT pipeline; normalized UTF-8; partial/retry staging; lease/candidate/delete fences; structured validation; provider default` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T boxlang boxlang tests/smoke.bxs` | `OK: Second Brain, BoxLang AI, PostgreSQL y pgvector disponibles.` |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P03_BROWSER_FIXTURE_RUN=task3-browser-01 -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/phase03-browser-fixture.bxs` | `{"conversationId":"809528df-a00b-4697-8e64-8fe83a6b9c58","reader":{"password":"phase03-browser-synthetic-password","email":"p03-browser-task3-browser-01-reader@example.invalid"},"run":"task3-browser-01","space":"Phase 03 browser task3-browser-01","documentId":"1a0b538a-4d88-4c31-8ce1-64abd5577ab0","owner":{"password":"phase03-browser-synthetic-password","email":"p03-browser-task3-browser-01-owner@example.invalid"},"status":"OK: synthetic indexed note, deterministic cited conversation and read-only shared fixture created; no network provider calls."}` |
| `P03_BROWSER_FIXTURE_RUN=task3-browser-01 node tests/phase03-frontend.mjs` | `OK: real Next → BoxLang proxy operations, cookie-only auth, no-store, strict IDs/methods, source and citation revision/offset forwarding, shared read-only permission, CSRF/Origin, empty scope, and exact 32,768/1,100,000-byte caps; no provider calls.` |
| `node --check tests/phase03-frontend.mjs` | Passed; no output. |
| `git diff --check` | Passed; no output. |

### Synthetic browser fixture

Fixture creator (run once in the scratch project):

```sh
bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T \
  -e P03_BROWSER_FIXTURE_RUN=task3-browser-01 \
  -e P02_ISOLATED_DATABASE=YES \
  boxlang boxlang tests/phase03-browser-fixture.bxs
```

Open `http://127.0.0.1:3005/app` and sign in with either account:

- Owner: `p03-browser-task3-browser-01-owner@example.invalid` / `phase03-browser-synthetic-password`
- Reader: `p03-browser-task3-browser-01-reader@example.invalid` / `phase03-browser-synthetic-password`

The `Phase 03 browser task3-browser-01` space contains an indexed note and shared deterministic conversation. Owner can continue/unshare; reader sees read-only history and a current source citation. The fixture calls `ProviderDouble` directly through `KnowledgeCore`/`LibraryTaskWorker`/`ConversationService`; no provider HTTP injection or paid provider call occurs. To run real proxy checks: `P03_BROWSER_FIXTURE_RUN=task3-browser-01 node tests/phase03-frontend.mjs`.

## Self-review and concerns

- Old indexed fragments and historical citation snapshots created before this change have no stored codepoint offsets. The UI fails closed (shows the saved excerpt/location and no guessed highlight). New TXT/note indexing persists offsets; old data is not automatically rebuilt.
- Browser visual/interaction acceptance is reserved for task 4 and was not claimed here. The deterministic fixture and real proxy contract test are ready for it.
- No new dependencies, runtime installs, credentials, or paid provider calls. Backend changes are limited to precise chunk coordinates and preventing file uploads from changing note provenance.

## Fix round 1 — authorization cleanup and proxy error envelopes

- Commit: `2d895d2` — Clear unauthorized chat state and normalize proxy errors.
- `loadOlder` now invokes the shared stale-aware authorization handler for 401/403. `toggleShared` does the same for 401/403; stale or aborted responses still do not run reset callbacks.
- Note title/body controls are disabled during save. Every Next-generated 404/405/413/415/502 now uses the task-2 `{errorCategory, category, message}` envelope with no-store/nosniff headers.
- Added `tests/phase03-auth-errors.mjs` for current 401/403 reset dispatch and stale-response suppression. Extended `tests/phase03-frontend.mjs` to assert proxy/local error envelopes against the running app.

Exact verification (scratch Compose; provider calls disabled):

| Command | Output |
|---|---|
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T frontend sh -lc 'cd /app && pnpm exec tsc --noEmit'` | Passed; no output. |
| `bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T frontend sh -lc 'cd /app && pnpm lint'` | `$ eslint`; passed. |
| `node tests/phase03-auth-errors.mjs` | `OK: current 401/403 invoke session/membership reset; stale auth failures are discarded; other errors remain available to callers.` |
| `P03_BROWSER_FIXTURE_RUN=task3-browser-01 node tests/phase03-frontend.mjs` | `OK: real Next → BoxLang proxy operations, cookie-only auth, no-store, strict IDs/methods, uniform local/BoxLang error envelopes, source and citation revision/offset forwarding, shared read-only permission, CSRF/Origin, empty scope, and exact 32,768/1,100,000-byte caps; no provider calls.` |
| `node --check tests/phase03-frontend.mjs && node --check tests/phase03-auth-errors.mjs` | Passed; no output. |
| `git diff --check` | Passed; no output. |

The task report is committed separately after this fix commit; no merge or push performed.
