# Fase 02 — implementación y comprobaciones del rol A

## Estado y alcance

- **Fecha/responsable:** 2026-10-11, rol A — plataforma y seguridad.
- **Rama/base:** `feat/phase02-a-platform-security`, desde `bb4ad88`; `origin/main` consultado con `git fetch`, contenido remoto incluido en la base. Árbol inicialmente limpio.
- **Estado:** 02.1–02.6 implementadas; P02.1–P02.5 comprobadas en API/núcleo sin IA, con el alcance abajo. **La fase sigue En curso:** faltan B (02.7–02.8/P02.6–P02.7), C y revisión integrada A/B/C. No se inicia fase 03.
- **Entorno:** Compose `second-brain`, BoxLang 1.18.0+66, bx-ai 3.5.0, bx-postgresql 1.2.0, PostgreSQL 17/pgvector 0.8.7; Node 24.21.0 del frontend únicamente como ejecutor de `node:assert`.
- **Datos:** cuentas `p02-<slug>-<rol>@example.invalid`, texto sintético y PDF de prueba de tamaño exacto. No claves ni llamadas a proveedores. `.env` no modificado.

## Entrega

Migración versionada 2: `documents`, `document_versions`, `document_tasks`, restricciones de espacio/revisión y claves idempotentes. Volumen `originals_data`, montado solamente en BoxLang en `/data/second-brain`, fuera de `/app` y de las rutas públicas. Nombres UUID internos; el nombre recibido solo es metadato. Incluso la copia de recepción usa un destino completo controlado `<UUID>/received.bin`, nunca el filename multipart. La capacidad de `FileUpload` de sustituir el nombre al recibir un destino completo se contrastó con su [fuente oficial](https://github.com/ortus-boxlang/boxlang-web-support/blob/main/src/main/java/ortus/boxlang/web/bifs/FileUpload.java) y el runtime instalado, porque la referencia MCP solo documenta directorios. Originales inmutables: copia a staging, registro `stored`, rename atómico y SHA-256 antes de `ready`. **`ready` describe el archivo, no la disponibilidad del conocimiento.**

`LibraryService` reutiliza `AccountService.authorize` y su comprobación Origin/CSRF. Las escrituras releen la membresía bajo el mismo bloqueo por espacio que las cuotas y la gestión de miembros. Límite decimal de 50.000.000 bytes y 1.000 documentos, incluidos tombstones con limpieza pendiente; lotes de 1–20 archivos. Se cuentan las partes reales mediante el exchange nativo, no solo el `count` declarado; campos extra y archivos repetidos en el mismo campo se rechazan, nunca se ignoran silenciosamente. La clave de operación pertenece al usuario/espacio: misma clave/entrada devuelve las mismas identidades; entrada distinta da `operation_conflict`; otro intento del mismo contenido da `duplicate`.

TXT/MD/JSON/CSV y extensiones de código acordadas se validan como UTF-8 estricto; JSON se parsea, PDF exige cabecera PDF y DOCX/XLSX cabecera ZIP. **Esto valida recepción/almacenamiento, no extracción multiformato completa:** corrupción estructural, contenido expandido/fragmentos y visores siguen en B/fases 03–04. No se descomprime ni ejecuta contenido recibido.

Las tareas tienen lease de 60 s y token nuevo por intento. `SKIP LOCKED` evita doble reclamación; heartbeat debe ejecutarse cada 15 s por el worker de B. Tres intentos automáticos, backoff 1/5/15 minutos, después reintento manual de una tarea fallida vigente. Los leases expirados se recuperan al reclamar y en mantenimiento. Al reiniciar, `Application.bx` reconcilia originales, tareas y tombstones si la migración existe; también hay CLI de mantenimiento. Original ausente/hash incorrecto falla sin destruir una revisión vigente; la misma carga idempotente puede reparar el archivo fallido.

El borrado primero persiste tombstone y cancela leases. Desaparecen acceso y listado inmediatamente; devuelve `deleting`/202 mientras queda limpieza pendiente y `deleted`/200 solo después de completarla. Las revisiones descartadas permanecen registradas hasta completar su limpieza; temporales sin referencia de más de 24 h se retiran.

## Contrato HTTP para C

Entrada directa: `/api/library.bxm?op=<operación>&spaceId=<id>`. Sesión en `sb_session`; Origin y `X-CSRF-Token` obligatorios para mutaciones. No hay transporte ni pantalla Next.js nuevos: corresponden a C.

| Operación | Método / parámetros | Resultado |
|---|---|---|
| `documents` | GET | `{documents:[...]}`, solo del espacio autorizado; revisión vigente y `attempt` con `taskId`, revisión candidata, estado/error |
| `upload` | POST multipart; `count`, `file1`, `name1`, `key1` … hasta 20 | HTTP 200 con `{results:[{index,status,document|error}]}`; no confundir éxito del sobre con éxito de todos los archivos |
| `upload` (reemplazo) | Igual; `documentId`; exactamente un archivo | Prepara revisión nueva sin retirar la vigente; misma autorización admin/editor |
| `original` | GET; `documentId` | Bytes privados, `attachment`, `nosniff`, CSP sandbox y `no-store`; nunca una URL pública ni un path en JSON |
| `task` | GET; `taskId` | Identidad, revisión, estado, intentos y categoría segura; sin token de lease ni rutas |
| `retry` | POST; `taskId` | 202 solo para tarea fallida vigente con original listo; lector denegado |
| `delete` | DELETE; `documentId` | 200 `deleted` o 202 `deleting`; repetición idempotente |

Los rechazos por archivo conservan su estado: 400 entrada/nombre/lote inválido; 413 tamaño; 415 formato/contenido; 409 duplicado, clave conflictiva o cuota. Sesión inválida 401; permiso/Origin/CSRF 403; recurso no perteneciente al espacio 404. Los errores inesperados son 500 `internal` sin SQL, rutas, contenido ni secretos.

MiniServer limita el sobre HTTP a 1.001.000.000 bytes (20 × 50 MB más envoltorio multipart). En esta versión `MAX_ENTITY_SIZE` también limita multipart; fijarlo a 16 KB impedía subir archivos grandes aunque `MULTIPART_MAX_ENTITY_SIZE` fuese mayor. El límite real por archivo se comprueba después de la recepción temporal. **El parser multipart de MiniServer recibe antes de ejecutar el código de autorización**; el límite de transporte no acredita resistencia a saturación de 30 cargas máximas ni reemplaza controles de proxy/despliegue de fase 08.

## Contrato interno para B — pendiente de integración

- `claimTask([taskId])` devuelve original privado, metadatos, espacio, documento, revisión esperada, identidad y lease. Solo código confiable del worker; no existe operación HTTP para reclamar/publicar/mantener.
- `heartbeat(taskId, leaseToken)` devuelve false si está obsoleto, expirado o eliminado; el worker debe abandonar el intento.
- `failTask(taskId, leaseToken, category, retryable)` registra únicamente categorías seguras y respeta el fence.
- `publishTask(taskId, leaseToken, commitResults)` comprueba documento/revisión/lease bajo bloqueo. El callback recibe `(documentId, versionId, previousVersion)` y publica resultados completos/retira derivados anteriores **dentro de la transacción BoxLang**. Una excepción revierte esa publicación. Un resultado obsoleto devuelve false sin invocar el callback; B debe descartar su staging.
- `new LibraryService(removeDerived)` recibe limpieza idempotente `(documentId, versionId)` de B para resultados publicados y temporales. Sin esa integración, una versión marcada como completada no puede declarar terminado el borrado; queda pendiente. B debe conectar el mismo callback en API y mantenimiento antes de activar la ingesta.
- **Presupuesto:** A todavía no ejecuta un pipeline ni llama a IA. La entrada de ingesta y API concreta del ledger de B no existen en la base. Su conexión dentro del flujo de tareas, con reserva antes de cada llamada y conciliación después, queda pendiente de acuerdo/integración con B; no se inventó otro ledger ni una firma de proveedor. No activar un worker real ni cerrar la fase sin ese contrato y P02.6–P02.7.

Las pruebas de publicación usan callbacks sintéticos para verificar transacciones/fences y archivos/registros. **No certifican embeddings, vectores, relaciones ni indexación real**, que se repiten con B en fases 03/07. La API nunca marca disponible un archivo por guardarlo.

## Comandos reproducibles

Elegir un slug nuevo y usarlo en toda la secuencia; ajustar `P02_ORIGIN` si el origen no es `http://127.0.0.1:3000`.

```sh
docker compose up -d --no-deps --wait boxlang
docker compose exec -T boxlang boxlang backend/migrations/migrate.bxs
docker compose exec -T boxlang boxlang tests/smoke.bxs
docker compose exec -T -e P02_RUN=core-check-01 boxlang boxlang tests/phase02-core.bxs
docker compose exec -T -e P02_RUN=http-check-01 frontend node --input-type=module < tests/phase02-http.mjs
docker compose exec -T -e P02_RUN=http-check-01 -e P02_FIXTURE=quota boxlang boxlang tests/phase02-fixtures.bxs
docker compose exec -T -e P02_RUN=http-check-01 -e P02_MODE=quota frontend node --input-type=module < tests/phase02-http.mjs
docker compose exec -T -e P02_RUN=http-check-01 -e P02_FIXTURE=audit boxlang boxlang tests/phase02-fixtures.bxs
docker compose exec -T -e P02_RUN=http-check-01 -e P02_FIXTURE=interrupted boxlang boxlang tests/phase02-fixtures.bxs
docker compose restart boxlang
docker compose up -d --no-deps --wait boxlang
docker compose exec -T -e P02_RUN=http-check-01 -e P02_MODE=after frontend node --input-type=module < tests/phase02-http.mjs
docker compose exec -T -e P02_RUN=http-check-01 -e P02_FIXTURE=cleanup boxlang boxlang tests/phase02-fixtures.bxs
docker compose exec -T boxlang boxlang backend/library-maintenance.bxs
```

`phase02-core.bxs` limpia exclusivamente su cuenta/espacio/archivos en `finally`; HTTP retiene fixtures para el reinicio y `phase02-fixtures.bxs` los elimina solo al pedir `cleanup`. Ejecutar los comandos CLI BoxLang de forma secuencial: comparten el home del runtime. No usar comandos de borrado sobre volúmenes.

## Resultados y revisión

- P02.1: original privado persistió/reconcilió después de un reinicio real; admin/editor/lector descargan, ajeno no; membresía retirada revoca acceso.
- P02.2: 50.000.001 bytes rechazados por núcleo **y multipart real**; 50.000.000 aceptados solo para almacenamiento. Con 999 identidades sintéticas, dos cargas concurrentes aceptan exactamente una; auditoría SQL confirma 1.000.
- P02.3: lote válido/EXE/nombre con traversal devuelve resultados 202/415/400; UTF-8 inválido y PDF con tipo incorrecto rechazados; contenido no ejecutado. Origin/CSRF y permisos comprobados por API.
- P02.4: staging comprometido y original ausente reconciliados, reupload idempotente repara sin duplicados; lease expirado no publica, intentos y límite de retries persisten; temporales >24 h limpiados. Tarea `processing` expirada preparada antes del reinicio real vuelve a `pending`/`interrupted`.
- P02.5: reemplazo fallido conserva original/revisión válida; excepción del callback revierte publicación; reemplazo posterior y tombstone impiden commits atrasados. Limpieza parcial devuelve `deleting`, mantenimiento la completa sin resucitar el documento.
- Fallos durante desarrollo corregidos y repetidos: resultados vacíos de `UPDATE … RETURNING` en este runtime (sustituidos por SELECT/bloqueo/UPDATE), techo global de Undertow aplicado también a multipart, callback opcional nulo al limpiar. La inspección final detectó que `FileUpload` con destino de directorio había escrito cuatro archivos sintéticos `escape*.bxs` fuera del subdirectorio UUID, dentro del volumen privado; nunca fueron ejecutados ni publicados. Se cambió a destino completo fijo, se repitió HTTP con filename `../../escape.bxs`, y se retiraron los cuatro residuos solo tras comprobar el nombre y contenido sintético exactos. La auditoría ahora comprueba también que no queden archivos fuera de los subdirectorios privados. Una ejecución paralela de CLI colisionó al crear `version.properties`; la auditoría pasó al repetirla secuencialmente. No son fallos aprobados ni evidencia de IA.
- Regresión sin IA: migración 2/replay, smoke, `tests/http.mjs`, crypto/expiry/HTTP/auditoría de fase 01. Slug fase 01 `p02-regression-20261011`; limpieza por su script existente.
- Slugs aprobados de A: `core-20261011-final3` y `http-20261011-final4` para la secuencia final, con auditoría de rutas incluida; comprobaciones anteriores completas `http-20261011-1912`, `http-20261011-final` y `http-20261011-final3`, limpiadas, y suite HTTP ampliada `http-20261011-final2`, limpiada. `git diff --check` revisa whitespace; no se hizo merge, push ni cierre global.
- No ejecutado: UI/browsers de fase 02, presupuesto, proveedor real, derivados de conocimiento reales, benchmark, backup/HTTPS. Ninguno se declara verificado.

Documentación oficial consultada por MCP BoxLang: [FileUpload](https://boxlang.ortusbooks.com/boxlang-framework/modularity/web-support/reference/built-in-functions/web/fileupload), [GetHTTPRequestData](https://boxlang.ortusbooks.com/boxlang-framework/modularity/web-support/reference/built-in-functions/web/gethttprequestdata), [Content](https://boxlang.ortusbooks.com/boxlang-framework/modularity/web-support/reference/components/web/content), [MiniServer](https://boxlang.ortusbooks.com/getting-started/running-boxlang/miniserver), [QueryExecute](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/jdbc/queryexecute). Lo no acreditado por documentación (rename NIO/JDBC) se comprobó contra el runtime instalado.
