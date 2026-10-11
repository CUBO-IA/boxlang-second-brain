# Fase 03 — implementación y cierre verificado

Fecha de cierre: **2026-10-11**. Estado: **Verificada para el alcance acotado P03.1–P03.9 de TXT/notas, chat, evidencia y permisos**. La revisión de especificación y calidad fue PASS para este alcance. No afirma soporte de otros formatos, garantía universal contra prompt injection ni despliegue remoto exitoso.

## Alcance y capacidades verificadas

- TXT y notas sintéticas se procesan mediante tareas, embeddings reales con presupuesto y publicación de revisiones completas; se verificaron reemplazo, borrado e idempotencia.
- La recuperación respeta espacio y selección de documentos. Respuestas multifuente incluyen afirmaciones, citas verificables y abstención cuando la evidencia no alcanza; se obtuvo una inferencia no abstinente con premisas explícitas y citas a TXT y nota.
- Conversaciones persistentes reutilizan historial como contexto, no como evidencia vigente. Se comprobaron citas históricas tras reemplazo/borrado, membresía, lectura compartida sin continuación por otro autor y permisos de selección.
- La interfaz comprobada incluye creación/edición de notas, chat, visores y resaltado de citas; se verificaron ES/EN, frase Unicode repetida, vista móvil de 375 px y proxy same-origin.
- Se probó una nota adversarial sintética junto a fuentes legítimas. La respuesta citó evidencia recuperada sin obedecer el marcador, inventar una cita, revelar patrones de credenciales ni cambiar roles/membresías. Esto no es una afirmación de seguridad universal.

## Base de ejecución y reproducibilidad

Versiones del entorno registradas en el [README](../../../README.md): BoxLang MiniServer/CLI **1.18.0+66** (Java incluido en la imagen), Next.js **16.4.0**, React **19.3.0**, Node.js **24.21.0**, `bx-ai` **3.5.0**, `bx-postgresql` **1.2.0**, PostgreSQL **17.11** y pgvector **0.8.7**.

Requiere Docker Compose y `.env` local con `POSTGRES_PASSWORD`; no se versionan credenciales. Ejecutar desde la raíz del repo. Crear primero un proyecto Compose nuevo/aislado: varias suites escriben o limpian conocimiento y ledger. Usar un nombre de proyecto libre y puertos que no estén ocupados; ejecutar las CLI secuencialmente. Al invocar `docker compose` sin `-f`, Compose carga el `compose.override.yaml` de desarrollo por defecto; no hace falta el wrapper ignorado del worktree.

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

Las salidas seguras registradas incluyen `OK: Second Brain, BoxLang AI, PostgreSQL y pgvector disponibles.` (smoke), `OK: inferred claims require explicit premises and current retrieved citations.` (regresión de inferencia sin proveedor) y salida exitosa de las comprobaciones deterministas, TypeScript y lint. La evidencia de fixture/navegador está en los informes P03 comprometidos. Estos comandos son instrucciones de reproducción; no se afirma que se hayan vuelto a ejecutar durante la revisión de cierre.

## Aceptación real autorizada — registro histórico

Los recorridos usaron únicamente datos sintéticos en el Compose aislado. La clave no se imprimió ni se incluyó en fixtures/logs; el opt-in se pasó solo al proceso de aceptación y el servicio ordinario permaneció `P00_ALLOW_PROVIDER_CALLS=NO`. No se limpiaron filas del ledger. La primera ejecución añadió reservas 942–956 (15/15 liquidadas, cero retenidas); las dos extensiones añadieron 957–976 y 977–996 (20/20 liquidadas cada una, cero retenidas).

Invocación Compose portable equivalente, con el opt-in y techo limitados al proceso de prueba. Es un registro de la aceptación ya ejecutada; **no ejecutar de nuevo sin autorización explícita para llamadas facturables**:

```sh
docker compose -p second-brain-phase03-evidence exec -T -e P00_ALLOW_PROVIDER_CALLS=YES -e P02_ISOLATED_DATABASE=YES -e P00_MAX_USD=1 -e BUDGET_DAILY_USD=1 boxlang boxlang tests/phase03-provider-acceptance.bxs
```

PASS real inicial (reservas 942–956), salida segura registrada:

```json
{"limitUSD":1,"reservationCount":15,"settledCount":15,"baselineReservationId":941,"totalCommittedUSD":0.00042078,"invocationCommittedUSD":0.0003395,"models":{"embed":"text-embedding-3-small","chat":"gpt-6-luna"},"retainedCount":0,"checks":["real durable TXT and note indexing","multisource citations include both source IDs and exact revisions/locations","Spanish question over English note","English question over Spanish TXT","question-only follow-up history","selected-source and absent-evidence abstention","empty selection rejected","replacement creates current-only evidence","replaced/deleted citations never open current content"],"dayUtc":"2026-10-11","operation":"phase03-product-real-provider","status":"PASS"}
```

PASS real final (reservas 977–996), salida segura literal con las métricas de cierre:

```json
{"limitUSD":1,"reservationCount":20,"settledCount":20,"observed":{"inference":{"citationCount":2,"noteCited":true,"label":"inferred","premiseCount":2,"txtCited":true},"promptInjection":{"citationCount":1,"validated":true,"credentialPatternsAbsent":true,"abstained":false,"retrievedCount":3,"markerAndFakeIdAbsent":true,"roleMembershipUnchanged":true,"claimCount":1},"accessDenials":{"newReservations":0,"nonMemberStatus":404,"foreignSourceStatus":400}},"baselineReservationId":976,"totalCommittedUSD":0.00140706,"invocationCommittedUSD":0.000494,"models":{"embed":"text-embedding-3-small","chat":"gpt-6-luna"},"retainedCount":0,"checks":["real durable TXT and note indexing","multisource citations include both source IDs and exact revisions/locations","inferred claim has explicit premises and cites TXT plus note","adversarial note retrieved with real sources; marker, credential patterns, fabricated citations, and membership changes rejected","non-member and out-of-space source IDs rejected before provider reservation","Spanish question over English note","English question over Spanish TXT","question-only follow-up history","selected-source and absent-evidence abstention","empty selection rejected","replacement creates current-only evidence","replaced/deleted citations never open current content"],"dayUtc":"2026-10-11","operation":"phase03-product-real-provider","status":"PASS"}
```

La ejecución intermedia 957–976 también pasó 20/20 reservas liquidadas, cero retenidas; coste real **USD 0.00049228**. Costes reales de la aceptación inicial 942–956: **USD 0.00033950**; cierre 957–976: **USD 0.00049228**; cierre 977–996: **USD 0.00049400**. Los dos cierres suman **USD 0.00098628**. Coste pagado conocido acumulado de reservas 941 y 942–996: **USD 0.00132618**. Es distinto del `committedUSD` diario final **USD 0.00140706**, que incluye reservas retenidas previas y quedó bajo el límite persistido de **USD 1.00000000**. No se restableció el límite y el opt-in ordinario siguió en `NO`.

## Registro formal de revisión y límites

La revisión de cierre del **2026-10-11** dio **spec PASS / quality PASS** y encontró atendidos los dos huecos de evidencia señalados: inferencia real con dos premisas y citas actuales de ambos documentos, e inyección adversarial recuperada con respuesta validada. La decisión `Verificada` se limita a la fase 03 descrita arriba.

Alcance revisado: revisión integral previa documentada en `.superpowers/sdd/03-ingesta-chat-y-evidencia/final-review.md` y fixes/evidencia en `final-fix-report.md` (incluidos en `1831f38`); cambio acotado de configuración de puertos de despliegue `04366a2`; corrección de la aceptación `8500a43`; y cierre de cobertura/tests `d50ce9b`. Se inspeccionaron también los informes de tareas comprometidos en ese mismo directorio. Estos nombres y commits son referencias del repositorio; este registro no depende de archivos temporales o reportes fuera del repo.

El cambio de puertos para Coolify está en el repositorio, pero **no se ejecutó ni se verificó un despliegue remoto**. Fases 04–09 siguen pendientes; los demás formatos, contradicciones, grafo, HTTPS de producción, backups y rendimiento no quedan incluidos en este cierre. No se modificaron permisos del proveedor. La finalización documental no volvió a ejecutar pruebas ni llamadas facturables.

## Mapa de evidencia P03.1–P03.9

- **P03.1:** aceptación real: TXT/nota indexados, respuesta multifuente, IDs/revisiones/ubicaciones citados y uso liquidado.
- **P03.2:** aceptación real: selección explícita, abstención por fuente/tema ausente y selección vacía rechazada.
- **P03.3:** regresión no facturable exige inferencia con dos premisas y citas actuales; aceptación real confirmó `inferred`, dos premisas y citas TXT+nota.
- **P03.4:** aceptación real: pregunta ES sobre nota EN, pregunta EN sobre TXT ES y seguimiento; prueba de conocimiento conserva límites de espacio.
- **P03.5:** pruebas de conversación y navegador: compartir, lectura sin continuación y permisos UI.
- **P03.6:** aceptación real: reemplazo/borrado con citas históricas; regresión determinista conserva vallas y reintentos.
- **P03.7:** pruebas de conversación/membresía y aceptación real: no miembro 404 y documento de otro espacio 400 antes de reservar proveedor.
- **P03.8:** aceptación real: nota adversarial sintética recuperada; sin marcador/ID falso, patrón de credencial, cita no validada ni cambio de membresía/rol. La regresión determinista de cita inválida permanece.
- **P03.9:** prueba CLI invoca el núcleo sin Next.js; aceptación real ejecutó worker y `ConversationService` sobre datos sintéticos indexados.
