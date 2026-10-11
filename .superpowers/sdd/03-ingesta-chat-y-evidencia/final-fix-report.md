# Informe de fixes — revisión final P03

Fixes y pruebas: commit `13311fa` (`fix(phase03): preserve published evidence during staging`).

## Cambios

- `KnowledgeIndex.upsertDocument` inserta solo el marcador inicial; al comenzar una revisión candidata no sobrescribe el marcador publicado. La publicación existente sustituye fragmentos y marcador dentro de la transacción cercada de `LibraryService.publishTask`.
- `ConversationService` valida `offset` y `afterSequence` como cadenas enteras no negativas antes de convertirlas. Las regresiones rechazan `abc`, fracciones, negativos y sufijos; aceptan `0`.
- Las regresiones cubren un reemplazo fallido a través de `LibraryTaskWorker` y `ConversationService`: la cita histórica sigue actual, consultas explícitas y de espacio recuperan la revisión publicada, y el candidato no aparece como evidencia. También verifican el marcador durante staging y que un upsert tardío no reviva un marcador borrado.

## Verificación

Se usó exclusivamente el proyecto Compose `second-brain-phase03-review`, con la base y volúmenes separados, puertos 3006/8086/55439, y `P00_ALLOW_PROVIDER_CALLS=NO`. No se operó sobre la base original ni se hicieron llamadas pagadas; la reserva original 941 permanece intacta.

Comando de infraestructura:

```text
bash .superpowers/sdd/03-ingesta-chat-y-evidencia/review-compose up -d --no-build --wait boxlang
```

Resultado: código 0; PostgreSQL y BoxLang `Healthy`.

Migraciones:

```text
bash .superpowers/sdd/03-ingesta-chat-y-evidencia/review-compose exec -T boxlang boxlang backend/migrations/migrate.bxs
```

Salida:

```text
Applied migration 1 from 001_accounts.sql
Applied migration 2 from 002_library.sql
Applied migration 3 from 003_budget_and_knowledge.sql
Applied migration 4 from 004_conversations.sql
Applied migration 5 from 005_conversation_turn_lease.sql
```

Pipeline:

```text
bash .superpowers/sdd/03-ingesta-chat-y-evidencia/review-compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/pipeline-p03.bxs
```

Salida:

```text
OK: durable notes/TXT pipeline; normalized UTF-8; partial/retry staging; lease/candidate/delete fences; structured validation; provider default
```

Conversaciones:

```text
bash .superpowers/sdd/03-ingesta-chat-y-evidencia/review-compose exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/conversation-p03.bxs
```

Salida:

```text
OK: private/shared authorization; live membership; scope isolation; safe question-only history; current/replaced/deleted citations; deterministic injected provider.
```

La aceptación real P03.1–P03.9 sigue pendiente. Estos resultados deterministas no la sustituyen ni cambian el estado **En curso**.
