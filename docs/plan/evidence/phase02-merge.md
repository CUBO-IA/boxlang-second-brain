# Fase 02 — integración para merge

Fecha: 2026-10-11. PR A #6 y B #3 sobre `main`, que ya incluye C (#5).

## A + C

- Resuelto el conflicto CSS conservando Terengue y los visores de fase 00.
- Alineados UUID de documentos/tareas, operaciones, multipart numerado con clave de operación, límites, categorías seguras y campos de biblioteca. Next.js sigue siendo transporte; las reglas permanecen en BoxLang.
- El reemplazo comprueba el resultado por archivo, no solo HTTP 200. El borrado `deleting` no se anuncia como limpieza completada.
- `tests/phase02-frontend.mjs` sustituye las comprobaciones del contrato propuesto contra doble por una prueba contra BoxLang real. `phase02-library-double.mjs` queda solo como fixture histórico, no acredita la integración vigente.

Entorno aislado: Compose `second-brain-phase02-merge`, puertos 3004/8084/55437, volúmenes nuevos; sin llamadas IA. Slugs `merge-a-core-20261011` y `merge-http-20261011`.

Comandos ejecutados con resultado correcto (CLI BoxLang secuencial):

```sh
FRONTEND_PORT=3004 BACKEND_PORT=8084 POSTGRES_PORT=55437 P00_ALLOW_PROVIDER_CALLS=NO docker compose -p second-brain-phase02-merge up -d --build --wait
docker compose -p second-brain-phase02-merge exec -T boxlang boxlang backend/migrations/migrate.bxs
docker compose -p second-brain-phase02-merge exec -T boxlang boxlang tests/smoke.bxs
docker compose -p second-brain-phase02-merge exec -T -e P02_RUN=merge-a-core-20261011 boxlang boxlang tests/phase02-core.bxs
docker compose -p second-brain-phase02-merge exec -T -e P02_RUN=merge-http-20261011 -e P02_ORIGIN=http://127.0.0.1:3004 frontend node --input-type=module < tests/phase02-http.mjs
docker compose -p second-brain-phase02-merge exec -T -e P02_RUN=merge-http-20261011 -e P02_ORIGIN=http://127.0.0.1:3004 frontend node --input-type=module < tests/phase02-frontend.mjs
```

También se ejecutó la secuencia quota → cargas concurrentes → audit → interrupted → reinicio BoxLang → HTTP `P02_MODE=after` del informe A: aprobada, exactamente 1.000 documentos y recuperación real de original/lease. Replay de migraciones, `tests/http.mjs`, `pnpm exec tsc --noEmit` y `pnpm lint`: correctos.

Navegador Chrome, origen 3004, cuenta sintética admin del slug HTTP: login y biblioteca reales; carga `browser.txt` + `browser.exe` muestra **1 de 2 aceptados**, TXT pendiente/no consultable, EXE rechazado por formato; fuente, tamaño, fecha, límites y enlaces privados visibles, sin error de renderizado.

## B sobre A+C

- Migración `003_budget_and_knowledge.sql`: `002` queda reservada a biblioteca. Aplicación sobre la base A y replay 1/2/3 aprobados.
- Conflictos documentales resueltos conservando el cierre técnico de fase 00 y su parche científico, no el bookkeeping anterior de B que aún describía ese fallo como abierto. La evidencia histórica de B permanece separada.
- `LibraryService` consulta `BudgetService.snapshot()` después de autorizar el espacio; devuelve solo `budget.exhausted`, no reservas, costes ni información de otras personas. En Chrome se comprobó el aviso real de presupuesto agotado con el ledger sintético del entorno aislado; después se restauró su límite.
- `budget-p02.bxs`, `knowledge-core-cli.bxs` y `knowledge-p03.bxs` aprobados secuencialmente sobre el esquema integrado. Los dos últimos son regresión del contenido incluido en PR #3, no autorización ni cierre de fase 03.
- Las suites de B borran datos globales de presupuesto/conocimiento. Se añadió el guard `P02_ISOLATED_DATABASE=YES`, también al probe real, y se documentó el requisito. Nunca ejecutar con datos de uso reales.
- Prueba web real repetida con el ledger y campos presupuestarios; TypeScript, lint y build de producción aprobados. El frontend dev se reinició después del build porque ambos comparten `.next` en ese contenedor.

```sh
docker compose -p second-brain-phase02-merge exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/budget-p02.bxs
docker compose -p second-brain-phase02-merge exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-core-cli.bxs
docker compose -p second-brain-phase02-merge exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-p03.bxs
```

La fase permanece **En curso**, no Verificada: P02.6 de B comprueba denegación secuencial, no dos reservas realmente simultáneas; P02.7 envejece una fila y ejecuta recuperación, pero no acredita un reinicio real con la reserva abierta. Esas comprobaciones y el checklist final de UI siguen pendientes. No se activa ningún worker ni se acredita ingesta real/fase 03; no hubo llamadas ni gasto de IA durante esta integración.

Para actualizar una base de `main`, aplicar migraciones antes de servir biblioteca. Una base experimental que ya hubiera usado `002` para B no es una base de `main`: no editar `schema_migrations` ni recrear volúmenes con datos; requiere revisión específica antes de actualizar.
