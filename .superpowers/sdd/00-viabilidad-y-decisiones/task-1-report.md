# Task 1 — Fase 00, informe de ejecución

## Resumen y estado

**Estado de fase: Bloqueada; pendiente de verificación independiente.** No se declara verificada ninguna puerta que requiera ejecución real o evidencia no disponible. Se respetó el Compose separado `second-brain-phase00` y no se efectuó ninguna llamada externa: no hay clave OpenAI configurada y el harness no se usa como credencial. No se crearon tablas de aplicación ni se tocaron volúmenes del proyecto original.

Revisión base: `844463a` (`docs: add second brain product specification`). Branch: `phase00-viability`. En esta ronda se parte del head comprometido `79dc776`, que contiene las correcciones previas de classPath y parámetros SQL. Versiones efectivas: BoxLang `1.18.0+66`; bx-ai `3.5.0+19`; bx-postgresql `1.2.0+4`; PostgreSQL `17.11`; extensión pgvector `0.8.7`; Next.js `16.4.0`. Compose aislado `second-brain-phase00`, puertos 3001/8081/55434 y volumen dedicado `second-brain-phase00_postgres_data`.

## Comandos y evidencia

Compose aislado terminó correctamente con:

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 up -d --build
```

Salida: imágenes frontend/boxlang construidas; red y volumen `second-brain-phase00` creados; Postgres healthy, BoxLang healthy y frontend started. La prueba de contrato pasó; `git diff --check` pasó. Smoke:

```text
OK: Second Brain, BoxLang AI, PostgreSQL y pgvector disponibles.
```

HTTP:

```text
OK: GET BoxLang, rechazo de POST y conexión desde Next.js.
```

Probe vectorial:

```text
OK: pre-retrieval space/document filters; replacement metadata; deletion; sibling preserved
```

La primera ejecución del probe en el commit anterior falló por resolución de clase y sintaxis/parámetros SQL; `79dc776` corrigió el classPath y SQL. Esta ronda sustituye ese probe por llamadas reales a bx-ai; la evidencia actual aparece en “Ronda de corrección 1”. El historial no se reescribe.

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec boxlang boxlang tests/smoke.bxs
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec -T frontend node --input-type=module < tests/http.mjs
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec boxlang boxlang tests/probe.bxs
node tests/contracts.mjs
```

Las pruebas `tests/smoke.bxs` y `tests/http.mjs` se conservaron sin cambios; smoke/HTTP no se repitieron en esta ronda porque no se alteraron sus componentes. El probe SQL citado arriba describe el commit anterior, no la evidencia actual. La prueba Node actual y las pruebas BoxLang contra bx-ai se detallan en “Ronda de corrección 1”.

Consulta oficial MCP complementada por inspección del source bx-ai instalado; APIs/capacidades confirmadas y limitaciones se registran en “Fuente instalada revisada”. No se encontró `.codegraph/` pertinente.

## Estado 00.1–00.10

| Ítem | Resultado honesto |
|---|---|
| 00.1 Línea base | Verificado localmente: Compose aislado healthy; smoke y HTTP pasaron. Versiones efectivas de BoxLang, PostgreSQL, pgvector y Next anotadas; versión efectiva exacta de módulos no recuperada. |
| 00.2 Respuesta `gpt-6-luna` | Implementación opt-in real mediante `aiChat` → OpenAI Chat Completions (`/v1/chat/completions`), `max_completion_tokens=32`, timeout 30 s, sin retries; la ejecución actual se bloqueó por falta de `OPENAI_API_KEY`, antes de red. Compatibilidad efectiva del modelo sigue bloqueada. |
| 00.3 Embeddings/1.536 | Bloqueada: sin clave no se generó embedding. No se creó esquema de negocio ni se confirma dimensión. |
| 00.4 Aislamiento | Probe bx-ai PostgresVectorMemory pasó con B más cercano, filtro de espacio y selección documental en recuperación/contexto antes del ranking/envío. Allowlist de varios documentos no soportada por el filtro de igualdad instalado. |
| 00.5 Ciclo vectorial | Probe bx-ai pasó reemplazo de 2 fragmentos/vectores, metadata revision, borrado, desaparición de resultados viejos y preservación integral de hermano/B. |
| 00.6 Extracción | Ejecutados ocho formatos: cinco loaders bx-ai (MD/TXT/JSON/código como texto/CSV), PDFLoader+PDFBox páginas; DOCX/XLSX con lectura OOXML de fixtures reales y limitada a su estructura. Loader bx-ai DOCX/XLSX ausente; módulos oficiales premium no instalados. |
| 00.7 Navegación/grafo | Componente React de navegación por fixture textual y grafo expandible implementado. Browser probado para ocho citas resaltadas y expansión de grafo. No es visor binario nativo; esa parte sigue bloqueada. Sin deps nuevas. |
| 00.8 Contratos | Clases BoxLang `Document` y `Location` validadas; entidades restantes/operaciones documentadas en contratos y plan. Se evita generar clases vacías especulativas. |
| 00.9 Fallos/operación | Defaults concretos temporales en `docs/plan/00…`: cotas, lease, fence, estados/publicación/reconciliación, presupuesto UTC/reserva y backup/carga. No implementados ni medidos; host/dominio/CPU/RAM y tarifa actual no disponibles. |
| 00.10 Evaluación | Manifiesto JSON congelado con 20 casos, preguntas, espacios/selección, fuentes/versiones/ubicaciones/evidencia/criterios y umbrales. Checks estructurales pasan; evaluación real no ejecutada. |

## Puertas P00

| Puerta | Estado |
|---|---|
| P00.1 | Parcial: smoke confirma módulos/JDBC/pgvector; HTTP confirma Next→BoxLang. Aprobada para la línea base ejecutada. |
| P00.2 | Bloqueada sin clave; no hay éxito simulado ni proveedor alternativo. |
| P00.3 | Aislamiento del módulo probado con vectores sintéticos precomputados y contexto local inspeccionado. La prueba de no envío a un modelo es composición comprobada, no tráfico de proveedor. |
| P00.4 | Probe lifecycle del módulo pasó; negativos separados confirman que omitir replace/delete falla. |
| P00.5 | Coordenadas de ocho formatos pasan para fixtures locales; UI hace selección y resaltado visible. Limitado: DOCX/XLSX no tienen loader oficial disponible y UI no renderiza archivos nativos. |
| P00.6 | Decisiones y brechas están escritas, pero loader oficial DOCX/XLSX, allowlist multi-documento y provider real siguen bloqueando cierre. |

## Contratos mínimos y persistencia propuesta

`Document`: id, spaceId, nombre, mediaType, version, status, metadata. `Fragment`: documentId/version, ordinal, texto, hash, embedding y metadata. `Location`: tipo, coordenadas inicial/final, cita literal. `Citation`: fragmentId, document version y location; validar existencia, texto y versión vigente al abrir. `Answer`: texto, etiquetas (respaldado/inferido/incierto), citations y abstention reason. `Conversation`: id, spaceId, owner y turnos; `Task`: id, documentId/version, estado, intentos explícitos y error categorizado; `Relation`: espacio, extremos tipados, tipo, evidencia y metadata.

Tablas futuras mínimas: spaces/members (fase posterior de permisos), documents, fragments (pgvector), conversations/messages, tasks, relations; no crear en fase 00. Operaciones: filtrar espacio + selección documental antes de nearest-neighbor; upsert/reemplazo atómico de versión; retirar derivados y marcar cita histórica obsoleta al borrar/reemplazar; validar permiso al servir original/cita/grafo. El contrato de dominio no depende de Next.js ni HTTP. La integración pgvector de bx-ai debe preferirse si pasa aislamiento y lifecycle; evitar duplicar tabla/adaptador sin evidencia.

## Extracción y navegación

Prueba ejecutada en contenedor para los ocho formatos. bx-ai 3.5.0+19 tiene `MarkdownLoader`, `TextLoader`, `JSONLoader`, `CSVLoader` y `PDFLoader`; no dispone de DOCX/XLSX. PDFLoader extrae contenido, pero la página se localiza separadamente con PDFBox; JSON/CSV cargan texto sin devolver coordenadas y se resuelven contra original. DOCX/XLSX usan fixtures OOXML ZIP válidos con repetición y lectura XML mínima dedicada al fixture (no generalizable ni adaptador de producto). `tests/contracts.mjs` resuelve las citas exactas por coordenadas, prueba contenido repetido y rechaza rangos inválidos. Los módulos oficiales bx-word/bx-spreadsheet no están instalados; la documentación los sitúa en BoxLang+, por lo que licencia/entitlement exacto debe confirmarse antes de incorporarlos. No se simularon esos loaders.

UI: `frontend/app/feasibility.tsx` abre selección de los ocho tipos en un visor textual de fixtures y resalta la cita/ubicación; navegador recorrió ocho tipos y confirmó cita y marca resaltada. El UI advierte que no renderiza formato nativo. Grafo sintético acotado con expansión directa, límite de ocho nodos; botón de expansión y actualización de vecinos probados. No hay biblioteca externa; es React nativo. Aún deben probarse visores nativos, teclado/lector y grafo con datos reales.

## Política operativa propuesta (no medida)

- Tareas (default propuesto): registro durable futuro PostgreSQL; lease 60 s/heartbeat 15 s, 3 intentos con backoff 1/5/15 min y después reintento manual; fence por versionId. Sin cola adicional. Pendiente implementar.
- Consistencia archivo/DB: staged write + hash; transacción registra versión no-ready en `stored`; rename atómico; transacción marca `ready`. Reconciliación al reinicio: retry rename desde stage; si final tiene hash esperado, ready; falta/mismatch => failed y anterior ready intacta. Limpiar stage huérfano >24 h. Borrado usa tombstone, reanudable/idempotente; nada aparece como listo hasta versión ready.
- Límites propuestos: 20 archivos por operación; 50 MiB/archivo (acordado), 100 MiB total texto extraído; máximo 8.000 caracteres/fragmento, solape 400, 500 fragmentos/documento; ZIP no admitido. Si se habilita luego, 100 MiB expandidos y 10.000 entradas. Exceder => error explícito y retener versión previa, no truncar.
- Presupuesto: USD 20/día UTC de especificación, reserva SQL atómica por operación concurrente; liquidar con usage y liberar/conciliar reservas; sin tarifa fechada configurada, no llamar. Errores de uso desconocido retienen reserva provisional. Control de app no limita usos externos de la misma clave. Defaults no implementados.
- Servidor/backup: HTTPS obligatorio detrás de proxy privado, no exponer puertos app; host/dominio/CPU/RAM intencionalmente no inventados. Backup diario de PostgreSQL más manifiesto/hash y snapshot de originales inmutables coordinados; default RPO 24 h/RTO 4 h, falta ensayo restauración y cifrado/retención por entorno.
- Carga: protocolo de medición: 1.000 docs/espacio, 30 sesiones concurrentes, documentos 1 MiB y hasta 50 MiB, registrar CPU/RAM/hardware, red, conexión y API/modelo. Gates acordadas p95 preguntas ≤30 s y texto 1 MiB ≤60 s; sin medición, los tamaños grandes aún requieren su propia curva.

## Manifiesto y rúbrica fija (20)

Casos: R01–R10, C01–C04, D01–D02, A01–A04, exactamente los escenarios/fuentes definidos en `docs/plan/06-contradicciones-y-evaluacion.md`. Cada ejecución debe fijar pregunta, espacio, selección de documentos, idioma, IDs/versiones de fuentes y ubicaciones admisibles. R01–R10: respuesta semánticamente correcta, citas exactas admisibles, etiquetas de respaldo/inferencia correctas. C01–C04: ambas partes y contexto, sin ganador automático. D01–D02: contextos distintos explícitos, ningún conflicto falso. A01–A04: abstención segura, motivo informativo y cero evidencia no seleccionada, obsoleta o de otro espacio. Un caso pasa solo si satisface todos sus criterios estructurales/semánticos; mínimo global 18/20 y simultáneamente cero fallo crítico de abstención, cero conflicto falso, todas las citas verificables y aislamiento/permisos aprobados. Evidencia admisible: texto/versiones fixture congelados y coordenadas reproducibles; la prosa del modelo no demuestra fuente. Preparación no equivale a ejecución fase 06.

## Cambios de esta tarea y auto-revisión

- La primera ronda añadió `Document`, `Location`, smoke/probes y fixtures de texto; véanse commits `5b8ec39`/`79dc776`.
- Esta ronda sustituye el probe SQL por el probe del módulo, endurece `Location`, añade fixtures/checks de extracción, manifiesto, proveedor opt-in y UI de factibilidad.
- No se añadieron dependencias, tablas persistentes, secretos ni credenciales del harness. Las tablas aleatorias de prueba se eliminan en `finally`.
- Pendientes de cierre: respuesta/modelo/embedding real autorizada; loaders oficiales DOCX/XLSX; filtro de allowlist multiselección; visor nativo y validación independiente de Sol. Se deja fase Bloqueada.

## Ronda de corrección 1 — F1–F9 (evidencia de este árbol)

Esta sección reemplaza expresamente los resultados preliminares anteriores donde se describían el probe SQL, ausencia de UI/manifest y decisiones como pendientes. No revierte ningún cambio de `79dc776`: ambos commits previos permanecen en la historia; se añade el nuevo commit de esta ronda tras congelar el árbol. Rama `phase00-viability`; Compose aislado existente, sin reset/rebuild de Postgres ni acceso al proyecto original.

### Fuente instalada revisada

Dentro de `boxlang` se examinó `/root/.boxlang/modules/bx-ai/box.json` (`bx-ai 3.5.0+19`, Apache-2.0) y el código `models/memory/vector/{PostgresVectorMemory,BaseVectorMemory}.bx`, `models/loaders/{Markdown,Text,JSON,CSV,PDF}Loader.bx`, `bifs/{aiChat,aiEmbed,aiService}.bx` y `models/providers/OpenAIService.bx`. `bx-postgresql` instalado `1.2.0+4`, Apache-2.0. Versiones host observadas: BoxLang `1.18.0+66`, PostgreSQL `17.11`, pgvector `0.8.7`, Next.js `16.4.0`.

Hallazgos concretos: `PostgresVectorMemory.storeDocument(id,text,embedding,metadata)`, `findSimilar(embedding,limit,filter)`, `removeWhere(filter)` y `remove(id)` son APIs reales. `findSimilar` pasa metadata filter a `searchByVector`; el SQL de fuente aplica `collection`, luego cada clave JSONB `metadata->>'key' = :key` dentro de `WHERE`, antes de `ORDER BY vector-distance` y `LIMIT`. Con eso sirven filtros de espacio y de un documento seleccionado. **Límite instalado**: el filtro disponible es igualdad por clave; no implementa allowlist de varios IDs con `IN`/`ANY`. No se añadió adaptador; esto bloquea selección múltiple hasta decidir query upstream o API compatible.

`OpenAIService.bx` expone chat OpenAI en `https://api.openai.com/v1/chat/completions` y embeddings en `/v1/embeddings`. `aiChat` y `aiEmbed` son BIF reales; el probe invoca modelos exactos `gpt-6-luna` y `text-embedding-3-small`. Código de OpenAIService no incorpora retry automático en este camino. `aiEmbed` usa response raw y verifica 1.536. El nombre de modelo/endpoints es configuración explícita; no hay fallback. Las docs oficiales MCP se consultaron; el detalle operable se confirmó con source instalada.

### Ejecución por hallazgo

| Hallazgo | Corrección y evidencia real |
|---|---|
| F1 | Se conserva `79dc776`: `config/boxlang.json` añade `classPaths: ["/modules/second-brain/backend"]`; `tests/probe.bxs` importa `secondBrain.Probe`. El entrypoint ya localiza/compila y alcanza las APIs bx-ai; ejecución normal más abajo pasa. |
| F2 | Se conserva la corrección `IN` de `79dc776` para SQL diagnóstico anterior; el test principal ahora deja de duplicar SQL y usa filtro real bx-ai, cuyo `WHERE` es equality parametrizada. No usa `ANY` ni parámetros de lista mal tipados. |
| F3 | `tests/probe.bxs` crea B más cercano que A, busca global (B primero), y luego hace dos recuperaciones separadas usando bx-ai: por espacio y por espacio+documentId. Inspecciona contexto de texto resultante y comprueba que B/hermano excluidos no entrarían. Fault injection confirma que omitir cada filtro hace fallar. |
| F4 | Crea dos fragmentos de `doc-a`, hermano de A y B; `removeWhere` debe retirar 2; inserta nueva revisión con dos vectores nuevos; comprueba embeddings/texto/revisión antigua desaparecidos y sibling id/text/metadata/vector intactos. `remove` elimina ambos IDs y `getById` confirma vacío. Fault injection para reemplazo y borrado falla como se espera. Todo está en PostgresVectorMemory, tabla generada por nombre aleatorio y eliminada en `finally`. |
| F5 | Ocho citas se asocian a su fixture y coordenada; `tests/contracts.mjs` extrae rango exacto y compara quote, incluida la segunda repetición; valida rangos inválidos. `tests/location.bxs` también comprueba invariante BoxLang. Navegador recorre ocho formatos y verifica highlight. |
| F6 | `tests/provider.bxs` ya no termina en `Not implemented`: usa aiChat/aiEmbed reales, modelo/API exactos, timeout 30, sin retry, max completion 32, una solicitud por tipo; falla cerrado antes de network salvo opt-in YES + key + techo <= USD 1 + tarifas USD/M-token positivas + cálculo conservador dentro del techo. Hoy se probaron los dos guards sin llamadas; ver salidas. No se usaron embeddings simulados para afirmar éxito P00.2. |
| F7 | `tests/extraction.bxs` ejecuta los loaders bx-ai disponibles y extrae cita/page real de PDF; fixture DOCX/XLSX son ZIP OOXML válidos y se verifica texto y coordenada. UI/grafo de factibilidad se implementó y probó en Chrome. Office loader oficial sigue brecha demostrada por ausencia de módulos (salida abajo); OOXML lector es expresamente fixture-only, no sustitución de loader de producto. |
| F8 | `docs/plan/00-viabilidad-y-decisiones.md` y este informe fijan defaults verificables y recuperación del estado de archivo/DB. Hardware, dominio y tarifas actuales se dejan desconocidos; no inventados. |
| F9 | `tests/evaluation/manifest.json`: 20 IDs exactos, fuentes textuales/versiones, preguntas, selección por espacio, ubicaciones/citas admisibles, criterios y puertas. `contracts.mjs` congela orden/cantidad, chequea referencias/selección y resuelve coordenadas exactas. No se ejecutó fase 06 ni se ajustaron prompts. |

### Comandos y salidas

Prefijo en `/tmp/opencode/second-brain-phase00` para todos los comandos siguientes: `FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00`.

```sh
... exec boxlang boxlang tests/probe.bxs
OK: bx-ai PostgresVectorMemory; B nearest; pre-ranking space/document filters; 2-fragment replace/delete; sibling/B preserved

... exec -e P00_PROBE_FAULT=space boxlang boxlang tests/probe.bxs
exit 1: Space filter missing from bx-ai retrieval

... exec -e P00_PROBE_FAULT=selection boxlang boxlang tests/probe.bxs
exit 1: Selected document filter missing from bx-ai retrieval

... exec -e P00_PROBE_FAULT=replace boxlang boxlang tests/probe.bxs
exit 1: Expected all old document fragments to be removed

... exec -e P00_PROBE_FAULT=delete boxlang boxlang tests/probe.bxs
exit 1: Deleted document still has vectors
```

Cada fault case creó tabla aleatoria propia; `finally` eliminó solo esa tabla. Las 4 salidas no son fallas de suite: son controles negativos que prueban que cada invariante detecta una omisión.

```sh
... exec boxlang boxlang tests/extraction.bxs
OK: MD=bx-ai MarkdownLoader; TXT/code=bx-ai TextLoader; JSON=bx-ai JSONLoader; CSV=bx-ai CSVLoader; PDF=bx-ai PDFLoader + PDFBox page 2 exact citation; DOCX=fixture-scoped OOXML ZIP/XML reader; paragraph 2 exact/repeated; XLSX=fixture-scoped OOXML ZIP/XML reader; Limits!B2=250
```

PDFBox emitió aviso benigno de fallback Helvetica→LiberationSans. `tests/format-capabilities.bxs`:

```text
AVAILABLE: bxai
NOT_INSTALLED: spreadsheet
NOT_INSTALLED: word
Installed bx-ai loader source checked: MarkdownLoader, TextLoader, JSONLoader, CSVLoader, PDFLoader; no DOCX/XLSX loader class exists in bx-ai 3.5.0+19.
```

La búsqueda MCP oficial confirma que SpreadsheetLoader está en bx-spreadsheet; docs listan bx-spreadsheet y bx-word como módulos BoxLang+ premium. No se agregaron módulos no autorizados ni se instaló runtime global. Bloqueo: no están instalados/entitled y no hay prueba que certifique loaders oficiales, metadatos completos o edge cases DOCX/XLSX; el check OOXML cubre el fixture exacto solamente.

```sh
... exec boxlang boxlang tests/location.bxs
OK: Location validates supported kind, positive coordinates, ordered range and exact quote length

... exec frontend node /tests/contracts.mjs
OK: eight format coordinate mappings resolve exact source quotes; repeated occurrence and invalid ranges checked

... exec frontend pnpm lint
$ eslint

... exec frontend pnpm exec tsc --noEmit
exit 0, sin salida

... exec frontend pnpm build
✓ Compiled successfully in 6.5s; TypeScript finished; routes / (dynamic) and /_not-found emitted
```

En el viewer, Chrome DevTools seleccionó cada opción Markdown/TXT/JSON/JavaScript/CSV/PDF/DOCX/XLSX y verificó `location`, quote visible y marcador `⟦...⟧`; ejemplos `policy.maxDays`, `fila 3 · columna limit`, `página 2`, `párrafo 2`, `hoja Limits · celda B2`. Click `Expandir policy` añadió `approval` sin recargar. Se corrigió `allowedDevOrigins: ["127.0.0.1"]` tras observación de Next dev bloquear HMR como origen cruzado; después la UI hidrató e interactuó correctamente. El grafo es fijo sintético, no grafo consultado de DB. No se añadió dependencia de visualización.

Provider gates, sin claves ni llamada:

```sh
... exec boxlang boxlang tests/provider.bxs
BLOCKED: opt in with P00_ALLOW_PROVIDER_CALLS=YES; no provider request made

... exec -e P00_ALLOW_PROVIDER_CALLS=YES boxlang boxlang tests/provider.bxs
BLOCKED: OPENAI_API_KEY absent; no provider request made
```

La prueba con opt-in fue detenida por la guard de key antes de leer respuesta/abrir red. Sin `OPENAI_API_KEY`, precios ni coste no se reportan. OpenAI tiene precios variables; la tasa debe ser suministrada explícitamente y fechada en variables `P00_CHAT_INPUT_USD_PER_MILLION`, `P00_CHAT_OUTPUT_USD_PER_MILLION`, `P00_EMBED_USD_PER_MILLION`; si faltan, la guard bloquea antes de llamar. Límite declarado no autoriza usar credenciales del harness. El presupuesto estimado es un preflight basado en las tasas configuradas, no garantía de facturación del proveedor.

### Decisiones, gaps y estado de cierre

Defaults de 00.9 escritos en el plan: 20 archivos/operación, 50 MiB cada uno, 100 MiB texto extraído, fragmento 8.000 chars/overlap 400/máximo 500, archivos comprimidos rechazados (si se habilitan: 100 MiB expandido, 10.000 entries), lease 60 s/heartbeat 15 s, 3 retries + backoff, fence de versionId, archivo immutable + `staging/stored/ready/failed/tombstone`, reconciliación por SHA-256 y anterior ready conservada, temporal huérfano 24 h, presupuesto USD20/día UTC con reserva, acceso privado HTTPS, backup diario coordinado, RPO24 h/RTO4 h provisional. Carga define 1.000 docs, 30 sesiones, 1 MiB y hasta 50 MiB con p95 objetivos existentes. No son valores medidos ni arquitectura productiva; hostname, CPU, RAM, dominio, rates dated requieren dato/decisión externa.

P00.1 ya pasó en ejecución anterior acreditada (smoke/http); no se repitió porque smoke/backend no cambió. Frontend hizo lint, typecheck y navegador. P00.2 permanece bloqueada por falta de key/model response/embedding/usage/coste. P00.3/4 pasan para integración vectorial instalada en el alcance probado, pero allowlist multi-documento y permisos de negocio no quedan cubiertos. P00.5 pasa para coordenadas de fixture/viewer textual; el viewer nativo y loaders oficiales Office bloquean aprobación integral. P00.6 sigue parcial por gaps indicados. Estado de fase no cambia: **Bloqueada**, Sol debe verificar y hacer bookkeeping final.
