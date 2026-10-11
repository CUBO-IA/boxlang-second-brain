# Fase 03 — implementación y estado de aceptación

Fecha: **2026-10-11**. Estado: **En curso**, pendiente de revisión integral del controlador. La implementación conecta TXT/notas, tareas con presupuesto, embeddings/indexación, recuperación y respuestas con citas, conversaciones persistentes y UI. Revisiones separadas de las tareas 1–3 y comprobaciones deterministas de pipeline, conversación/migración, presupuesto, conocimiento, HTTP/proxy, TypeScript y lint pasaron. En navegador se comprobó ES/EN con frase Unicode repetida y resaltado exacto, creación/edición de nota y estado pendiente, cita histórica reemplazada, lectura compartida sin continuación, aislamiento al cambiar a un espacio vacío y viewport de 375 px sin desbordamiento observado. La aceptación real de proveedor descrita abajo pasó para su recorrido; esto no declara aprobados todos los requisitos P03.1–P03.9.

## Comprobaciones reproducibles sin proveedor

Requiere Docker Compose y un `.env` local con `POSTGRES_PASSWORD`; no se incluyen credenciales. Use este proyecto/volumen aislado: algunas suites limpian tablas de conocimiento y el ledger diario. Ejecute las CLI secuencialmente.

```sh
FRONTEND_PORT=3005 BACKEND_PORT=8085 POSTGRES_PORT=55438 P00_ALLOW_PROVIDER_CALLS=NO docker compose -p second-brain-phase03-evidence up -d --build --wait
docker compose -p second-brain-phase03-evidence exec -T boxlang boxlang backend/migrations/migrate.bxs
docker compose -p second-brain-phase03-evidence exec -T boxlang boxlang tests/smoke.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/phase03-registration-scope.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/pipeline-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/conversation-migration-v5.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/conversation-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-core-cli.bxs
docker compose -p second-brain-phase03-evidence exec -T frontend pnpm exec tsc --noEmit
docker compose -p second-brain-phase03-evidence exec -T frontend pnpm lint
```

Las suites deterministas usan dobles, pero algunas escriben/eliminan datos y por eso exigen la base aislada. `phase03-registration-scope.bxs` no llama a proveedores y verifica el fallo del identificador sin calificar y el registro correcto con `local.request`. La prueba de migración v5 lee `backend/migrations/005_conversation_turn_lease.sql`, archivo incluido en el repo. No se incluye `phase03-auth-errors.mjs` como comando del contenedor frontend: su import relativo apunta fuera de las rutas montadas ahí.

## Fixture y recorrido de navegador

El fixture crea cuentas y espacio sintéticos, indexa notas con `ProviderDouble` y no hace llamadas de red al proveedor. Use un slug nuevo, de 1–24 caracteres en minúsculas, números o guiones:

```sh
P03_BROWSER_FIXTURE_RUN=browser-check-01 docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES -e P03_BROWSER_FIXTURE_RUN=browser-check-01 boxlang boxlang tests/phase03-browser-fixture.bxs
P03_BROWSER_FIXTURE_RUN=browser-check-01 P03_FRONTEND_URL=http://127.0.0.1:3000 P03_ORIGIN=http://127.0.0.1:3005 docker compose -p second-brain-phase03-evidence exec -T -e P03_BROWSER_FIXTURE_RUN=browser-check-01 -e P03_FRONTEND_URL=http://127.0.0.1:3000 -e P03_ORIGIN=http://127.0.0.1:3005 frontend node --input-type=module < tests/phase03-frontend.mjs
```

El primer comando imprime los correos y la contraseña sintética de owner/reader. Para comprobación manual, abra `http://127.0.0.1:3005/app`, inicie sesión como owner y seleccione el espacio `Phase 03 browser-check-01`: abra la conversación con cita actual, compruebe el resaltado de la frase repetida `«café 🧠»` y la conversación histórica cuya fuente fue reemplazada. Repita en ES/EN y entre como reader para comprobar lectura sin controles de continuación. El script Node valida además la cita por offsets Unicode, permisos, proxy y errores HTTP. Use un slug distinto para repetir; no reutilice cuentas/fixtures existentes.

## Gate real autorizado

`tests/phase03-provider-acceptance.bxs` pasó una vez con datos sintéticos en Compose aislado. El 500 original se debía al test: en este runtime `request` sin calificar resuelve al scope incorporado (sin `method`), no a `var request`; el registro correcto usa `local.request`. `AccountService` y su captura HTTP segura no se modificaron. Reproducción no facturable: `tests/phase03-registration-scope.bxs`.

Comando ejecutado con opt-in solo para ese proceso, base aislada y techo USD 1:

```sh
bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P00_ALLOW_PROVIDER_CALLS=YES -e P02_ISOLATED_DATABASE=YES -e P00_MAX_USD=1 -e BUDGET_DAILY_USD=1 boxlang boxlang tests/phase03-provider-acceptance.bxs
```

Resultado **PASS**: 15 reservas nuevas (942–956), las 15 liquidadas, cero retenidas; 9 llamadas de embedding y 6 de chat. Coste real de esta ejecución: **USD 0.00033950** (embeddings USD 0.00000470; chat USD 0.00033480). Committed total del día: **USD 0.00042078** bajo el límite persistido **USD 1.00000000**; se conserva la reserva 941 (settled, actual USD 0.00000040). Tras el comando, el entorno del servicio sigue con `P00_ALLOW_PROVIDER_CALLS=NO`; no se expuso la clave. Evidencia externa detallada: `/tmp/opencode/phase03-corrections/acceptance-report.md`.

Este resultado acredita el recorrido automatizado probado, no todos los requisitos de fase ni despliegue remoto. La fase permanece **En curso** hasta revisión integral del controlador; no se afirma restauración del límite persistido a USD 20.
