# Fase 02 — cierre verificado

Fecha: **2026-10-11**. Base `442c49c`, después de integrar PR A #6, B #3 y C #5. Revisión y ejecución por agente OpenCode a petición del usuario. **Resultado: Verificada para biblioteca, tareas y presupuesto; no equivale a indexación ni cierra fase 03.**

## Entorno y correcciones

Compose aislado `second-brain-phase02-close`, puertos 3004/8084/55437 y volúmenes nuevos. BoxLang 1.18.0+66, bx-ai 3.5.0, bx-postgresql 1.2.0, PostgreSQL 17/pgvector 0.8.7, Next.js 16.4.0/React 19.3.0/Node 24.21.0. Slugs `close-20261011`, `close-core-20261011`, `close-regression-20261011` y `close-expiry-20261011`. Sin modificar `.env` ni leer/exponer claves. Cero llamadas IA y USD 0 reales.

La revisión siguió todos los callers de `BudgetService` y `BudgetGatedCaller`. Se corrigieron:

- Arranque sin recuperación de reservas: `Application.onApplicationStart` recupera huérfanas si existe la tabla, además de recuperar archivos/tareas. El umbral de 15 minutos retiene reservas recientes; nunca libera uso desconocido.
- Coste confirmado superior al límite: se registra íntegro como liquidado, se deniegan nuevas reservas y se devuelve disponibilidad cero, no un número negativo ni un 500. Filas históricas retenidas con coste conocido cuentan el mayor entre reserva y coste.
- Estimación insegura por caracteres/4 y salida del proveedor distinta de la reservada: entrada acotada por bytes UTF-8; chat añade 64 tokens de envoltorio para el adaptador de un solo mensaje y envía exactamente el límite de salida reservado. Se rechazan embeddings >8.192 bytes, chat >32.000 bytes o salida fuera de 1–4.096 tokens, sin truncar ni llamar. Es una política conservadora de admisión, no un tokenizador universal.
- Uso ausente/malformado: se retiene la reserva y se informa resultado no conciliado; no se fabrica uso estimado como si estuviera confirmado. Se elimina también la devolución de mensajes crudos del proveedor.

No se creó un ledger alternativo, un scheduler ni un worker de ingesta. Los nuevos casos quedaron en `tests/budget-p02.bxs`; los fixtures de UI amplían el script existente.

## Resultados P02.1–P02.7

| Prueba | Comprobación ejecutada | Resultado |
|---|---|---|
| P02.1 | Original persistente y privado tras reinicio real; autorizado/ajeno, lector y revocación | Aprobada |
| P02.2 | 50.000.001 bytes por multipart real rechazados; límite exacto en núcleo; dos cargas con 999 documentos dejan exactamente 1.000 | Aprobada |
| P02.3 | Lote válido/EXE/traversal con resultado individual, CSRF/Origin y auditoría de rutas; UI diferencia formato/tamaño | Aprobada |
| P02.4 | Staging/registro, original ausente, replay idempotente, lease vencido y recuperación tras reinicio real | Aprobada |
| P02.5 | Rollback de publicación sintética, versión vigente preservada, tarea obsoleta y tombstone; limpieza parcial recuperable | Aprobada, sin acreditar derivados de conocimiento reales |
| P02.6 | Dos threads BoxLang/JDBC listos en barrera; proveedor doble bloqueado mientras la otra operación se deniega | Aprobada: una sola invocación al proveedor, sin liberar anticipadamente la reserva para falsear concurrencia |
| P02.7 | Reserva huérfana y otra activa persistidas; reinicio real; recuperación automática por HTTP/startup antes de ejecutar comprobación CLI; conciliación tardía y liberación idempotentes | Aprobada: consumo comprometido intacto, reserva reciente no robada, sin doble conciliación/liberación |

Casos adicionales aprobados: uso ausente/negativo retenido, entrada Unicode conservadora, cap de salida efectivamente enviado, rechazo previo de entrada/salida excesivas y coste sintético 21 USD frente a techo 20 USD completamente contabilizado, bloqueando operaciones posteriores. No se gastaron esos importes.

## Comandos reproducibles

Ejecutar las CLI BoxLang **secuencialmente**. Las suites de B requieren una base aislada: limpian el ledger del día y, en las suites de conocimiento, las tablas de conocimiento.

```sh
FRONTEND_PORT=3004 BACKEND_PORT=8084 POSTGRES_PORT=55437 P00_ALLOW_PROVIDER_CALLS=NO docker compose -p second-brain-phase02-close up -d --build --wait
docker compose -p second-brain-phase02-close exec -T boxlang boxlang backend/migrations/migrate.bxs
docker compose -p second-brain-phase02-close exec -T boxlang boxlang tests/smoke.bxs
docker compose -p second-brain-phase02-close exec -T -e P02_ISOLATED_DATABASE=YES -e P02_BUDGET_MODE=before -e P02_RUN=close-20261011 boxlang boxlang tests/budget-p02.bxs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-core-20261011 boxlang boxlang tests/phase02-core.bxs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-20261011 -e P02_ORIGIN=http://127.0.0.1:3004 frontend node --input-type=module < tests/phase02-http.mjs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-20261011 -e P02_ORIGIN=http://127.0.0.1:3004 frontend node --input-type=module < tests/phase02-frontend.mjs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-20261011 -e P02_FIXTURE=quota boxlang boxlang tests/phase02-fixtures.bxs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-20261011 -e P02_ORIGIN=http://127.0.0.1:3004 -e P02_MODE=quota frontend node --input-type=module < tests/phase02-http.mjs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-20261011 -e P02_FIXTURE=audit boxlang boxlang tests/phase02-fixtures.bxs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-20261011 -e P02_FIXTURE=interrupted boxlang boxlang tests/phase02-fixtures.bxs
docker compose -p second-brain-phase02-close restart boxlang
docker compose -p second-brain-phase02-close exec -T boxlang curl --fail --silent --retry 15 --retry-connrefused --retry-delay 1 http://127.0.0.1:8080/api/health.bxm
docker compose -p second-brain-phase02-close exec -T -e P02_ISOLATED_DATABASE=YES -e P02_BUDGET_MODE=after -e P02_RUN=close-20261011 boxlang boxlang tests/budget-p02.bxs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-20261011 -e P02_ORIGIN=http://127.0.0.1:3004 -e P02_MODE=after frontend node --input-type=module < tests/phase02-http.mjs
docker compose -p second-brain-phase02-close exec -T -e P02_RUN=close-20261011 -e P02_FIXTURE=ui boxlang boxlang tests/phase02-fixtures.bxs
```

Migración limpia 1/2/3 y replay: aprobados. Regresión adicional: `knowledge-core-cli.bxs` y `knowledge-p03.bxs` con `P02_ISOLATED_DATABASE=YES`; crypto, expiración, HTTP y auditoría fase 01 con sus slugs y `P01_ORIGIN=http://127.0.0.1:3004`; `vector-roundtrip.bxs`, `tests/http.mjs`, TypeScript, lint, build y `git diff --check`: aprobados. Una invocación inicial de expiración sin `P01_RUN` fue rechazada por su guard, se repitió correctamente con slug. El build se ejecutó dentro del contenedor y se reinició después frontend dev para no compartir artefactos `.next` incompatibles.

## Checklist de navegador real

Chrome, `http://127.0.0.1:3004/app`, sesiones aisladas admin y lector del slug HTTP; BoxLang/DB/volumen reales, no el doble HTTP histórico.

- Login admin, fuente TXT, bytes, fecha, estado y acciones visibles. Fallos sintéticos de tareas creados por `P02_FIXTURE=ui`: proveedor y presupuesto tienen mensajes diferentes. El aviso global usa solo `{exhausted}`, sin reservas/costes ajenos.
- Reintento real de `ui-provider.txt`: pasa a pendiente. `P02_FIXTURE=ui-processing` reclama la tarea real; el polling muestra **Procesando** sin recargar.
- Original sintéticamente publicado `ui-stable.txt`: intento fallido conserva disponibilidad/original. Reemplazo EXE devuelve aviso de formato, no éxito; nuevo TXT queda como reemplazo en curso y la descarga sigue devolviendo los bytes anteriores.
- Borrado de ese fixture publicado sin callback de derivados en API devuelve limpieza pendiente: fila desaparece y UI dice **Documento retirado. La limpieza continúa**, no afirma borrado completo. La limpieza sintética posterior usa el callback del fixture.
- Carga por input real de TXT + EXE + PDF de 50.000.001 bytes: **1 de 3 aceptados**, documento pendiente/no consultable; errores distintos de formato y límite, nunca éxito global.
- Cambio al segundo espacio mientras se demora 2,5 s una respuesta **real** del espacio anterior: solo aparece `ui-other-space.txt`; la respuesta tardía no reintroduce filas anteriores. Solo se demora la entrega en navegador, no se simula su contenido ni la autorización.
- Lector en EN: sin carga ni botones de reemplazo/reintento/borrado; descarga original autorizada, DELETE manual con su CSRF devuelve 403. Aviso **Daily AI budget used up**, advertencia OpenAI e información de conversaciones históricas visibles. Se comprobó también la versión ES.
- Admin retira al lector mediante API real: el polling recibe la pérdida de acceso, desaparecen biblioteca y nombres protegidos; quedan selector vacío y aviso de acceso actualizado.

Los fixtures publicados son callbacks sintéticos para verificar estados/consistencia, **no embeddings ni indexación reales**. Los derivados se vuelven a verificar al conectarse en fases 03/07. No se hizo benchmark de 30 usuarios, despliegue HTTPS, backup ni ninguna llamada de proveedor real. Esos límites no bloquean el alcance de fase 02.

Documentación oficial consultada: MCP BoxLang [threading](https://boxlang.ortusbooks.com/boxlang-language/syntax/threading), transacciones/JDBC y scopes. No se instaló ningún runtime ni módulo global, ni nuevas dependencias.

Al terminar se repitió la suite de presupuesto completa, se limpiaron solo las cuentas/archivos sintéticos de los slugs de cierre y se detuvo Compose de prueba sin borrar volúmenes. El smoke del proyecto principal también pasó. No se tocaron datos privados ni se inició fase 03.
