# Fase 03 — implementación y estado de aceptación

Fecha: **2026-10-11**. Estado: **En curso**, no verificada. La implementación conecta TXT/notas, tareas con presupuesto, embeddings/indexación, recuperación y respuestas con citas, conversaciones persistentes y UI. Revisiones separadas de las tareas 1–3 y comprobaciones deterministas de pipeline, conversación/migración, presupuesto, conocimiento, HTTP/proxy, TypeScript y lint pasaron. En navegador se comprobó ES/EN con frase Unicode repetida y resaltado exacto, creación/edición de nota y estado pendiente, cita histórica reemplazada, lectura compartida sin continuación, aislamiento al cambiar a un espacio vacío y viewport de 375 px sin desbordamiento observado.

## Comprobaciones reproducibles sin proveedor

Requiere Docker Compose y un `.env` local con `POSTGRES_PASSWORD`; no se incluyen credenciales. Use este proyecto/volumen aislado: algunas suites limpian tablas de conocimiento y el ledger diario. Ejecute las CLI secuencialmente.

```sh
FRONTEND_PORT=3005 BACKEND_PORT=8085 POSTGRES_PORT=55438 P00_ALLOW_PROVIDER_CALLS=NO docker compose -p second-brain-phase03-evidence up -d --build --wait
docker compose -p second-brain-phase03-evidence exec -T boxlang boxlang backend/migrations/migrate.bxs
docker compose -p second-brain-phase03-evidence exec -T boxlang boxlang tests/smoke.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/pipeline-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/conversation-migration-v5.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/conversation-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-core-cli.bxs
docker compose -p second-brain-phase03-evidence exec -T frontend pnpm exec tsc --noEmit
docker compose -p second-brain-phase03-evidence exec -T frontend pnpm lint
```

Las suites deterministas usan dobles, pero algunas escriben/eliminan datos y por eso exigen la base aislada. La prueba de migración v5 lee `backend/migrations/005_conversation_turn_lease.sql`, archivo incluido en el repo. No se incluye `phase03-auth-errors.mjs` como comando del contenedor frontend: su import relativo apunta fuera de las rutas montadas ahí.

## Fixture y recorrido de navegador

El fixture crea cuentas y espacio sintéticos, indexa notas con `ProviderDouble` y no hace llamadas de red al proveedor. Use un slug nuevo, de 1–24 caracteres en minúsculas, números o guiones:

```sh
P03_BROWSER_FIXTURE_RUN=browser-check-01 docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES -e P03_BROWSER_FIXTURE_RUN=browser-check-01 boxlang boxlang tests/phase03-browser-fixture.bxs
P03_BROWSER_FIXTURE_RUN=browser-check-01 P03_FRONTEND_URL=http://127.0.0.1:3000 P03_ORIGIN=http://127.0.0.1:3005 docker compose -p second-brain-phase03-evidence exec -T -e P03_BROWSER_FIXTURE_RUN=browser-check-01 -e P03_FRONTEND_URL=http://127.0.0.1:3000 -e P03_ORIGIN=http://127.0.0.1:3005 frontend node --input-type=module < tests/phase03-frontend.mjs
```

El primer comando imprime los correos y la contraseña sintética de owner/reader. Para comprobación manual, abra `http://127.0.0.1:3005/app`, inicie sesión como owner y seleccione el espacio `Phase 03 browser-check-01`: abra la conversación con cita actual, compruebe el resaltado de la frase repetida `«café 🧠»` y la conversación histórica cuya fuente fue reemplazada. Repita en ES/EN y entre como reader para comprobar lectura sin controles de continuación. El script Node valida además la cita por offsets Unicode, permisos, proxy y errores HTTP. Use un slug distinto para repetir; no reutilice cuentas/fixtures existentes.

## Worker con proveedor real (opt-in)

El worker instancia `KnowledgeCore`: con `P00_ALLOW_PROVIDER_CALLS=NO` falla al inicializar, incluso si no hay tareas. Ejecutar el siguiente comando requiere autorización explícita para llamadas reales, credenciales configuradas en el entorno privado y presupuesto disponible. Procesará tareas reales pendientes (hasta el límite por defecto de 10), generará consumo facturable y usará el ledger diario. **No se ejecutó.**

```sh
docker compose -p second-brain-phase03-evidence exec -T -e P00_ALLOW_PROVIDER_CALLS=YES boxlang boxlang backend/library-worker.bxs
```

## Gate real y costes conocidos

La aceptación nueva `tests/phase03-provider-acceptance.bxs` se intentó dos veces y ambas terminaron en HTTP 500 al registrar la cuenta sintética, antes de invocar embedding o chat; la causa sigue sin determinar. Por tanto **la aceptación real P03.1–P03.9 no está aprobada**. Una sonda de embedding separada sí se reservó y liquidó por **USD 0.00000040**. El último `committedUSD` diario observado fue **USD 0.00008128**, incluye la línea base sintética ejecutada dos veces y **no representa únicamente gasto real facturado**. No se hizo una llamada real de chat. El controlador verificó `P00_ALLOW_PROVIDER_CALLS=NO` y que `budget_days.limit_usd` persistía como **USD 1.00000000**; no se afirma que se restaurara al valor por defecto de USD 20. No se incluyen ni registran secretos.

Pendiente para cerrar: diagnosticar el 500 del registro sintético y completar la aceptación real autorizada; después, revisión integral final del branch y registro de su resultado. No se deben presentar las pruebas deterministas como sustituto de ese gate.
