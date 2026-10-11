# Fase 03 — implementación y estado de aceptación

Fecha: **2026-10-11**. Estado: **En curso**, pendiente de revisión integral del controlador. La implementación conecta TXT/notas, tareas con presupuesto, embeddings/indexación, recuperación y respuestas con citas, conversaciones persistentes y UI. Revisiones separadas de las tareas 1–3 y comprobaciones deterministas de pipeline, conversación/migración, presupuesto, conocimiento, HTTP/proxy, TypeScript y lint pasaron. En navegador se comprobó ES/EN con frase Unicode repetida y resaltado exacto, creación/edición de nota y estado pendiente, cita histórica reemplazada, lectura compartida sin continuación, aislamiento al cambiar a un espacio vacío y viewport de 375 px sin desbordamiento observado. La aceptación real de proveedor descrita abajo pasó para su recorrido; esto no declara aprobados todos los requisitos P03.1–P03.9.

## Comprobaciones reproducibles sin proveedor

Requiere Docker Compose y un `.env` local con `POSTGRES_PASSWORD`; no se incluyen credenciales. Use este proyecto/volumen aislado: algunas suites limpian tablas de conocimiento y el ledger diario. Ejecute las CLI secuencialmente.

```sh
FRONTEND_PORT=3005 BACKEND_PORT=8085 POSTGRES_PORT=55438 P00_ALLOW_PROVIDER_CALLS=NO docker compose -p second-brain-phase03-evidence up -d --build --wait
docker compose -p second-brain-phase03-evidence exec -T boxlang boxlang backend/migrations/migrate.bxs
docker compose -p second-brain-phase03-evidence exec -T boxlang boxlang tests/smoke.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/phase03-registration-scope.bxs
docker compose -p second-brain-phase03-evidence exec -T boxlang boxlang tests/phase03-inference-validation.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/pipeline-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/conversation-migration-v5.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/conversation-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-p03.bxs
docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES boxlang boxlang tests/knowledge-core-cli.bxs
docker compose -p second-brain-phase03-evidence exec -T frontend pnpm exec tsc --noEmit
docker compose -p second-brain-phase03-evidence exec -T frontend pnpm lint
```

Las suites deterministas usan dobles, pero algunas escriben/eliminan datos y por eso exigen la base aislada. `phase03-registration-scope.bxs` reproduce sin proveedor el fallo del identificador sin calificar y verifica el registro con `local.request`; `phase03-inference-validation.bxs` valida inferencias/premisas/citas sin red ni base de datos. La prueba de migración v5 lee `backend/migrations/005_conversation_turn_lease.sql`, archivo incluido en el repo. No se incluye `phase03-auth-errors.mjs` como comando del contenedor frontend: su import relativo apunta fuera de las rutas montadas ahí.

## Fixture y recorrido de navegador

El fixture crea cuentas y espacio sintéticos, indexa notas con `ProviderDouble` y no hace llamadas de red al proveedor. Use un slug nuevo, de 1–24 caracteres en minúsculas, números o guiones:

```sh
P03_BROWSER_FIXTURE_RUN=browser-check-01 docker compose -p second-brain-phase03-evidence exec -T -e P02_ISOLATED_DATABASE=YES -e P03_BROWSER_FIXTURE_RUN=browser-check-01 boxlang boxlang tests/phase03-browser-fixture.bxs
P03_BROWSER_FIXTURE_RUN=browser-check-01 P03_FRONTEND_URL=http://127.0.0.1:3000 P03_ORIGIN=http://127.0.0.1:3005 docker compose -p second-brain-phase03-evidence exec -T -e P03_BROWSER_FIXTURE_RUN=browser-check-01 -e P03_FRONTEND_URL=http://127.0.0.1:3000 -e P03_ORIGIN=http://127.0.0.1:3005 frontend node --input-type=module < tests/phase03-frontend.mjs
```

El primer comando imprime los correos y la contraseña sintética de owner/reader. Para comprobación manual, abra `http://127.0.0.1:3005/app`, inicie sesión como owner y seleccione el espacio `Phase 03 browser-check-01`: abra la conversación con cita actual, compruebe el resaltado de la frase repetida `«café 🧠»` y la conversación histórica cuya fuente fue reemplazada. Repita en ES/EN y entre como reader para comprobar lectura sin controles de continuación. El script Node valida además la cita por offsets Unicode, permisos, proxy y errores HTTP. Use un slug distinto para repetir; no reutilice cuentas/fixtures existentes.

## Gate real autorizado

`tests/phase03-provider-acceptance.bxs` pasó con datos sintéticos en Compose aislado. El 500 original se debía al test: en este runtime `request` sin calificar resuelve al scope incorporado (sin `method`), no a `var request`; el registro correcto usa `local.request`. `AccountService` y su captura HTTP segura no se modificaron. Reproducción no facturable: `tests/phase03-registration-scope.bxs`.

Comando ejecutado con opt-in solo para ese proceso, base aislada y techo USD 1:

```sh
bash .superpowers/sdd/03-ingesta-chat-y-evidencia/compose exec -T -e P00_ALLOW_PROVIDER_CALLS=YES -e P02_ISOLATED_DATABASE=YES -e P00_MAX_USD=1 -e BUDGET_DAILY_USD=1 boxlang boxlang tests/phase03-provider-acceptance.bxs
```

El recorrido inicial pasó con 15 reservas nuevas (942–956), todas liquidadas, coste **USD 0.00033950**. La extensión de cobertura pasó dos veces: 957–976 costó **USD 0.00049228** y 977–996 costó **USD 0.00049400**; cada ejecución liquidó 20/20 reservas y no retuvo ninguna. La última verificó una inferencia real `inferred`, dos premisas, citas tanto del TXT como de la nota; la consulta de inyección recuperó los tres fragmentos, produjo una respuesta validada (1 afirmación/1 cita), sin marcador, patrón de credenciales ni cambio de membresías. El miembro no autorizado recibió 404 y la fuente de otro espacio 400, ambos antes de reservar uso (delta 0). Coste de la extensión: **USD 0.00098628**; coste real conocido acumulado en las reservas 941, 942–956 y 957–996: **USD 0.00132618**.

Después de la última ejecución, `committedUSD` diario es **USD 0.00140706** bajo el límite persistido **USD 1.00000000**; incluye reservas retenidas anteriores. Las reservas 941 y 942–956 se preservaron. Las 20 reservas nuevas 977–996 quedaron liquidadas. El servicio sigue con `P00_ALLOW_PROVIDER_CALLS=NO`; no se expuso ni registró la clave. Evidencia y salidas exactas: `/tmp/opencode/phase03-corrections/closure-report.md` y `/tmp/opencode/phase03-corrections/acceptance-report.md`.

### Mapa de evidencia P03.1–P03.9

- **P03.1:** aceptación real: TXT/nota indexados, respuesta multifuente, IDs/revisiones/ubicaciones citados y uso liquidado.
- **P03.2:** aceptación real: selección explícita, abstención por fuente/tema ausente y selección vacía rechazada.
- **P03.3:** prueba no facturable `phase03-inference-validation.bxs` exige inferencia con dos premisas y citas, y rechaza premisas ausentes/cita externa; aceptación real exige además inferencia del proveedor con dos premisas/citas TXT+nota.
- **P03.4:** aceptación real: pregunta ES sobre nota EN, pregunta EN sobre TXT ES y seguimiento; `knowledge-p03.bxs` conserva límites de espacio.
- **P03.5:** pruebas previas `conversation-p03.bxs`, `phase03-browser-fixture.bxs` y `phase03-frontend.mjs`: compartir, lectura sin continuación y permisos UI.
- **P03.6:** aceptación real: reemplazo y borrado con citas históricas; `pipeline-p03.bxs` conserva vallas/reintentos deterministas.
- **P03.7:** `conversation-p03.bxs` conserva las comprobaciones de membresía/IDs; aceptación real niega al no miembro y el ID de documento en otro espacio antes de reservar proveedor.
- **P03.8:** aceptación real: una nota sintética adversarial indexada y recuperada junto a fuentes legítimas; respuesta real sin marcador, valor de credencial, cita falsa ni cambio de membresía; `knowledge-p03.bxs` mantiene la regresión determinista de cita inválida.
- **P03.9:** `knowledge-core-cli.bxs` conserva invocación del núcleo sin Next.js; aceptación real ejecuta el worker y `ConversationService` sobre los datos sintéticos indexados.

Este resultado acredita el recorrido automatizado probado, no todos los requisitos de fase ni despliegue remoto. La fase permanece **En curso** hasta revisión integral del controlador; no se afirma restauración del límite persistido a USD 20.
