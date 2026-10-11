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
- Límites propuestos: 20 archivos por operación; 50 MB = 50,000,000 bytes por archivo, 100 MB = 100,000,000 bytes UTF-8 extraídos; máximo 8,000 Unicode code points/fragmento, solape 400, 500 fragmentos/documento; ZIP no admitido. Si se habilita luego, 100 MB expandidos y 10,000 entradas. Exceder => error explícito y retener versión previa, no truncar.
- Presupuesto: USD 20/día UTC de especificación, reserva SQL atómica por operación concurrente; liquidar con usage y liberar/conciliar reservas; sin tarifa fechada configurada, no llamar. Errores de uso desconocido retienen reserva provisional. Control de app no limita usos externos de la misma clave. Defaults no implementados.
- Servidor/backup: HTTPS obligatorio detrás de proxy privado, no exponer puertos app; host/dominio/CPU/RAM intencionalmente no inventados. Backup diario consistente de PostgreSQL+manifiesto/hash+originales inmutables, cifrado AES-256-GCM fuera del volumen, retención 7 diarios/4 semanales/12 mensuales y ensayo trimestral propuestos. RPO 24 h/RTO 4 h, no medidos.
- Carga: protocolo de medición con 1,000 docs/espacio, 30 sesiones concurrentes, tamaño 1 MB = 1,000,000 bytes y hasta 50 MB = 50,000,000 bytes, registrar CPU/RAM/hardware, red, conexión y API/modelo. Targets candidatos p95 pregunta ≤30 s, indexación 1 MB ≤60 s, archivos 1–10 MB ≤2 min, >10–25 MB ≤5 min, >25–50 MB ≤10 min; ninguno medido.

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

Defaults de 00.9 escritos en el plan: 20 archivos/operación; **50 MB = 50,000,000 bytes** por archivo; 100 MB = 100,000,000 bytes UTF-8 extraídos; 8,000 Unicode code points/fragmento, overlap 400, máximo 500; comprimidos rechazados (si se habilitan: 100 MB expandidos, 10,000 entradas); lease 60 s/heartbeat 15 s, 3 retries + backoff, fence de versionId, archivo immutable + `staging/stored/ready/failed/tombstone`, reconciliación por SHA-256 y anterior ready conservada, temporal huérfano 24 h, presupuesto USD20/día UTC con reserva. Backup diario PostgreSQL+manifiesto+originales, cifrado AES-256-GCM previo a salida del volumen, retención 7 diarios/4 semanales/12 mensuales, restore conjunto trimestral propuesto; RPO24 h/RTO4 h. Carga define 1,000 docs, 30 sesiones, 1 MB=1,000,000 bytes y bins de archivos 1/2/5/10/25/50 MB; p95 candidato pregunta ≤30 s, indexado 1 MB ≤60 s, >1–10 MB ≤2 min, >10–25 MB ≤5 min y >25–50 MB ≤10 min. Nada se midió. Hostname, CPU, RAM, dominio, red/topología y rates con fecha requieren datos externos, no se inventan.

P00.1 ya pasó en ejecución anterior acreditada (smoke/http); no se repitió porque smoke/backend no cambió. Frontend hizo lint, typecheck y navegador. P00.2 permanece bloqueada por falta de key/model response/embedding/usage/coste. P00.3/4 pasan para integración vectorial instalada en el alcance probado, pero allowlist multi-documento y permisos de negocio no quedan cubiertos. P00.5 pasa para coordenadas de fixture/viewer textual; el viewer nativo y loaders oficiales Office bloquean aprobación integral. P00.6 sigue parcial por gaps indicados. Estado de fase no cambia: **Bloqueada**, Sol debe verificar y hacer bookkeeping final.

## Ronda de corrección 2 — F5/F7/F8/F9, N1–N4 y límite del grafo

Base verificada al iniciar: `bb9da99` en `phase00-viability`. Se conservaron intactos los artefactos `docs/plan/01..09` y `docs/plan/verificacion.md` que ya estaban sin seguimiento. No se instalaron módulos, bibliotecas, runtimes ni servicios; no hubo llamadas OpenAI, credenciales del harness ni pruebas reales con clave. Resultado de esta ronda: correcciones locales completas donde eran ejecutables; **P00.2/P00.3 real de proveedor permanece bloqueado** por falta de clave/tarifa autorizada. Fase sigue **Bloqueada**.

### Evidencia por finding

| Finding | Corrección local efectiva y prueba |
|---|---|
| F5 / N1 / N3 | La UI ya no tiene documentos/citas paralelos ni usa `lastIndexOf`. `tests/export-evidence.bxs` ejecuta loaders bx-ai y reutiliza `backend/secondBrain/EvidenceExtractor.bx` para PDFBox + PDF/OOXML acotado/validado; exporta `frontend/app/evidence.generated.json`, consumido por React. Cada fila incluye archivo, versión, SHA-256, texto normalizado, ubicación BoxLang y coordenadas inicio/fin. DOCX lee cada párrafo/orden de runs, su cita única se enlaza a párrafo 2/offset 1 aunque el párrafo 3 repita la misma cadena. El viewer extrae el rango solo por índices exportados. `contracts.mjs` compara hashes con archivos actuales, resuelve las ocho ubicaciones, verifica offsets enteros, inicio/fin en el mismo identificador, quote exacta y las repeticiones; un cambio del fixture contra el hash exportado falla solicitando regeneración. |
| F7 | PDF/XLSX de evaluación son ahora fixtures binarios reales `tests/fixtures/locations.pdf` y `locations.xlsx`; DOCX/XLSX también se materializan como archivos, y los `.b64` quedan chequeados byte-por-byte. El extractor reutilizable `EvidenceExtractor` limita PDF/Office a 50,000,000 bytes/archivo, 10,000 entradas ZIP, partes XML ≤1,000,000 bytes, deshabilita `DOCTYPE`/entidades externas, no extrae rutas, valida destino/relaciones/celdas y falla explícitamente. La representación normalizada del XLSX muestra hoja/celdas; DOCX párrafos. No se compraron módulos premium ni se afirma que este extractor pequeño implemente todos los features/edge cases Office. |
| F8 | Plan y defaults actualizados con unidades decimales explícitas, bins/objetivos propuestos >1 MB, cifrado AES-256-GCM previo al backup, retención 7/4/12 y ensayo trimestral. Benchmark/cifrado/restore no se presentan como hechos medidos. Host/dominio/CPU/RAM/red siguen pendiente externa. |
| F9 / N2 | R03 vuelve a usar fuentes R01+R02 y exige combinar plazo/aprobador. R09 ahora pregunta en inglés a fuente española y tiene follow-up inglés. Cada C01–C04 y D01–D02 tiene dos citas con línea, offsets y quote. A03 excluye explícitamente source+versión 1+status replaced+espacio+coordenada; A04 compara frases casi idénticas `...42`/`...43` en espacios distintos. R04/R07 refieren bytes reales PDF/XLSX y sus SHA-256. `contracts.mjs` verifica hashes, selección, versiones, coordenadas/evidencia y exclusiones. |
| N4 | Provider probe ahora emite NDJSON machine-readable (`BLOCKED`/`ERROR`/`OBSERVED`/`PASS`) y persiste append-only cada evento a `/tmp/second-brain-provider-probe.ndjson` (sobrescribible mediante `P00_PROVIDER_RECORD_PATH`). Requiere fecha y referencia de tarifa, límites/tasas suministrados, conserva respuesta+usage+config+estimado antes de la siguiente llamada, y contiene embedding 1,536 → tabla aleatoria bx-ai → recuperación filtrada → DROP en `finally`. Sin key, solo se validaron guards; no se invocó ni ejecutó el flujo autorizado ni se atribuye compatibilidad real. |
| Límite grafo | Grafo local de 10 nodos, visible set calculado con `Set` (expanded + neighbors) para dedupe; expansión solo se habilita si todos los nodos resultantes caben en el tope 8. Chrome expande `policy` y `limits`, ambos alcanzan el mismo `approval` sin duplicarlo y el contador llega a 8/8; botones que harían exceder límite quedan deshabilitados. |

### Comandos, resultados y salidas observadas

Prefijo de contenedor: `FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00` desde `/tmp/opencode/second-brain-phase00`.

**N1/F5/F7 — regeneración desde extracción ejecutable, no fixture duplicado:**

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec -T boxlang boxlang tests/export-evidence.bxs > /tmp/opencode/second-brain-export.stdout
python3 - <<'PY'
import json
from pathlib import Path
lines=Path('/tmp/opencode/second-brain-export.stdout').read_text().splitlines()
data=json.loads(next(line for line in reversed(lines) if line.startswith('{')))
Path('frontend/app/evidence.generated.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
for d in data['documents']: print(d['id'],d['location']['start'],repr(d['location']['quote']),d['sha256'])
PY
```

Salida real (8 records):

```text
extractor="bx-ai loaders + bounded PDFBox/OOXML EvidenceExtractor"
locations.md {line:3,offset:1} 'repeat phrase' sha256=6e94f4fd7a8865af9c3536129584c094213ddac1d14a3aedb8b266263078a939
locations.txt {line:3,offset:1} 'Exact TXT target' sha256=d1f4268f5b0c65f20bb0de5f3b2fd152f0facd94401cbab9f2289350ad6d898e
locations.js {line:3,offset:16} 'Exact CODE target' sha256=75d709575b3c2195b7adfbe373f92fe6479b78dcd831146f8e4fc0bc91abea01
locations.jsondata {path:policy.maxDays,offset:1} '10' sha256=b502cec39bd90a8b6205dc7cebe66e2087d017a8fb0284b592566bfa1de99703
locations.csv {row:3,column:limit,offset:1} '40' sha256=156ab85684ab30d3cf84f37544ac276901e726b21dded047bea234abbf937018
locations.pdf {page:2,offset:1} 'For urgent purchases, attach prior authorization.' sha256=0a60abb347fab948b25ac7008763d7b7832ac726e50b19de53bc25478a6641f5
locations.docx {paragraph:2,offset:1} 'Exact DOCX target' sha256=b4c176199aa61a4d2eccd8ad61e71b4adad94b361218f1611447d808b8c019d5
locations.xlsx {sheet:Limits,cell:B2,offset:1} '250' sha256=954b981418130f67401d2d19c6471e7d8bc398353cdeb8707015685a8c037ba7
```

**F7 — extracción de los eight formatos reales/locales:**

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec boxlang boxlang tests/extraction.bxs
```

```text
OK: MD=bx-ai MarkdownLoader; TXT/code=bx-ai TextLoader; JSON=bx-ai JSONLoader; CSV=bx-ai CSVLoader; PDF=bx-ai PDFLoader + PDFBox page 2 exact citation; DOCX=fixture-scoped OOXML ZIP/XML reader; paragraph 2 exact/repeated; XLSX=fixture-scoped OOXML ZIP/XML reader; Limits!B2=250
```

**F5/N2/F9 — hashes, coordenadas, repeticiones, evaluación congelada:**

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec frontend node /tests/contracts.mjs
```

```text
OK: 8 BoxLang-exported source hashes/coordinates; repeated DOCX paragraph 2; stale-export, integer/range guards; 20 fully referenced evaluation cases and source hashes
```

Negativos específicos dentro de esa misma ejecución: fixture con SHA cambiado rechaza la exportación no regenerada; `end.line=2` tras `start.line=3` se rechaza; offset fraccionario y rango invertido se rechazan. DOCX tiene dos matches textuales y la coordenada de salida resuelve índice de párrafo 2 (index 1 en array); la marca no aparece en párrafo 3.

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec boxlang boxlang tests/location.bxs
```

```text
OK: Location validates supported kind, positive coordinates, ordered range and exact quote length
```

El check BoxLang rechaza línea/página/fila fraccionaria, offset fraccionario, fin en línea anterior, rango invertido y celda XLSX inválida.

**Prueba browser focalizada en `http://127.0.0.1:3001/`:**

Chrome DevTools seleccionó los ocho documentos con el control real y leyó label, cita, contenido exportado y marca. Resultado por formato: `Markdown repeat phrase`, `TXT Exact TXT target`, `JavaScript Exact CODE target`, `JSON 10 @ policy.maxDays`, `CSV 40 @ row3/limit`, `PDF For urgent purchases, attach prior authorization. @ page2`, `DOCX Exact DOCX target @ paragraph2`, `XLSX 250 @ Limits!B2`; en cada caso `marks=1, exactQuote=true`. Snapshot DOCX: `paragraph1 = Header repeated quote / paragraph2 = ⟦Exact DOCX target⟧ / paragraph3 = Exact DOCX target`, demostrando N1 corregido.

Accesibilidad teclado observada: control select → `End`, `Enter` selecciona XLSX y pinta `Limits!B2`; `Escape`, `Tab`, `Enter` expande `policy`; `Tab`, `Enter` expande `limits`; status actualiza `8/8 nodos visibles`, shared `approval` aparece una sola vez, `owner`/`approval`/`retention` que excederían presupuesto quedan disabled. Grafo de 10 IDs, no requiere librería.

**F8 — comandos frontend requeridos:**

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec frontend pnpm lint
$ eslint

FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec frontend pnpm exec tsc --noEmit
(exit 0, sin salida)

FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec frontend pnpm build
✓ Compiled successfully in 2.0s; TypeScript finished; dynamic / and static /_not-found emitted
```

**F3 — multiselección por consultas bx-ai filtradas de forma independiente:**

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec boxlang boxlang tests/probe.bxs
OK: bx-ai PostgresVectorMemory; B nearest excluded; selected 2/3 docs via per-document pre-ranking filters; top-k score merge/dedupe; empty selection; 2-fragment replace/delete; siblings preserved
```

La selección A contiene `doc-a` + `sibling`, de 3 documentos/2 espacios; B global es el nearest y no se consulta para el contexto permitido. Se ejecuta una llamada findSimilar por cada docId con `spaceId`+`documentId` en WHERE, luego score-desc merge, dedupe id y top-k 10. Entrada vacía retorna `[]` antes de consultar. Fault injection por omitir filtros:

```text
exec -e P00_PROBE_FAULT=space ... tests/probe.bxs -> exit 1: Space filter missing from bx-ai retrieval
exec -e P00_PROBE_FAULT=selection ... tests/probe.bxs -> exit 1: Multi-document selection/merge/dedupe failed: a-2,a-1,sibling-1
exec -e P00_PROBE_FAULT=replace ... tests/probe.bxs -> exit 1: Expected all old document fragments to be removed
exec -e P00_PROBE_FAULT=delete ... tests/probe.bxs -> exit 1: Deleted document still has vectors
```

Son controles negativos deliberados, cada uno creó y limpió su propia tabla aleatoria de bx-ai. El filtro multi-documento no bloquea técnicamente: se satisface por consultas escalares independientes, no se sustituyó bx-ai.

**N4 — provider guard machine-readable; todas las pruebas cortadas antes de la red:**

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec -e P00_PROVIDER_RECORD_PATH=/tmp/p00-round2-no-opt-in.ndjson boxlang boxlang tests/provider.bxs
{"reason":"P00_ALLOW_PROVIDER_CALLS must equal YES","passed":false,"requestsMade":0,"status":"BLOCKED"}

FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec -e P00_ALLOW_PROVIDER_CALLS=YES -e P00_PROVIDER_RECORD_PATH=/tmp/p00-round2-no-key.ndjson boxlang boxlang tests/provider.bxs
{"reason":"OPENAI_API_KEY absent","passed":false,"requestsMade":0,"status":"BLOCKED"}

FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec -e P00_ALLOW_PROVIDER_CALLS=YES -e OPENAI_API_KEY=P00_GUARD_ONLY_NON_CREDENTIAL -e P00_PRICE_DATE=2026-10-11 -e P00_PRICE_REFERENCE=guard-only-not-a-tariff -e P00_MAX_USD=0.001 -e P00_CHAT_INPUT_USD_PER_MILLION=1000000 -e P00_CHAT_OUTPUT_USD_PER_MILLION=1000000 -e P00_EMBED_USD_PER_MILLION=1000000 -e P00_PROVIDER_RECORD_PATH=/tmp/p00-round2-over-budget.ndjson boxlang boxlang tests/provider.bxs
{"reason":"Conservative combined estimate exceeds configured ceiling","passed":false,"requestsMade":0,"status":"BLOCKED"}
```

El último valor de key es un sentinel usado solo en un caso cerrado obligatoriamente por el preflight (>ceiling); no es una credencial y no llegó a aiChat/aiEmbed. La ejecución paralela simultánea de dos BoxLang launches tuvo un race de inicio del runtime copiando `version.properties`; repetir el caso sin concurrencia produjo el JSON `BLOCKED` anterior. Registro del caso sin key leído de disco con `cat /tmp/p00-round2-no-key.ndjson`: exactamente el mismo evento JSON. No hubo request externa. Sin clave no se acreditan dimensión, compatibilidad, usage ni coste reales. Fechas/rates no se atribuyen como tarifas actuales; referencias/rates del caso sentinela son solo guards.

### Decisiones externas y estado final

50 MB/1 MB usan base decimal explícita. Objetivos de indexación por bins y backup cifrado/retención están acordados como propuestas para implementación, no resultados de benchmark ni servicio backup existente. Falta hardware/host/dominio/red para convertirlos en capacidad garantizada; falta key/model endpoint autorizado y tarifa fechada para provider. No hay falla local evitada/re-etiquetada en esta ronda; la única razón restante para no validar real P00.2/00.3 es ausencia de acceso autorizado. P00.5 y manifiesto pasan **para fixtures/representación normalizada local**; no se proclama un parser universal Office o fase 06 aprobada. Sol debe volver a revisar antes de cualquier cambio a Verificada.

## Ronda de corrección 3 — F9/N2, N5–N8

Base confirmada: `51083c9` (`phase00-viability`). Se revisó íntegramente `sol-rereview-2.md`; planes 01–09/verificación preexistentes permanecieron sin seguimiento e intactos. No se ejecutó proveedor/red, no se añadieron dependencias, no se inició fase 01, no se apagaron servicios y no se hizo push/merge. P00 sigue **Bloqueada**.

### Cambios y veredictos

| Finding | Veredicto tras corrección local |
|---|---|
| N5 / F9 A04 | Corregido: fuente A autorizada dice `Recovery phrase is stored in the authorized offline binder.` (no contiene la frase/valor); pregunta pide el valor. A04 exige abstenerse, evidence permanece vacío y la fuente casi idéntica de espacio B queda excluida explícitamente. El contrato comprueba la respuesta correcta y no fija el incorrecto `...43`. |
| N6 / F9 R05–R06 | Corregido: `contracts.mjs` resuelve tipo JSON-path por segmentos existentes y escalar exacto; resuelve CSV por fila/encabezado/columna en la fuente congelada, cita offsets y quote. Negativos de ruta `nonexistent.path`, fila 999 y tipo desconocido fallan. |
| N7 | Corregido en subconjunto: `EvidenceExtractor` obtiene párrafos, runs, relaciones, celdas y textos XLSX mediante `xmlParse` seguro + `xmlSearch`/`XMLText`; las entidades XML se decodifican por el parser, runs se concatenan en orden. DOCX rechaza tab/break/object/field instructions no soportados; XLSX rechaza fórmulas/celdas/tipos/referencias no soportados. Ya no hay regex que copie XML crudo ni `&amp;` parcial. |
| N7 límites de celdas | Corregido y probado: rechaza `B0`, referencia faltante, índice shared-string fraccionario y fuera de rango; no omite celdas inválidas con `continue`. Índices deben tener sintaxis entera decimal y estar en límites. |
| N8 / F9 R07 | Corregido: fixture real XLSX ahora contiene `Summary` como hoja 1 con distractor `B2=999`, y `Limits` como hoja 2 con objetivo `B2=250`. El extractor sigue la relación de workbook, no asume sheet1. Se regeneraron `.xlsx`, `.b64`, hash, manifest y export. |
| Mantener acreditado | Extraction bx-ai loaders, PDFBox, contratos completos, ubicación y frontend checks pasan. No se retocaron vector/provider/Location ni suites sin motivo; no hubo llamadas de IA. |

El extractor sigue siendo un subconjunto explícito para documentos textuales/estructurados de los fixtures, no un parser universal de Office. Fuentes consultadas: MCP oficial `xmlParse`/`xmlSearch` y XML accessors: <https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/xml/xmlparse>, <https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/xml/xmlsearch>, <https://boxlang.ortusbooks.com/boxlang-language/syntax/xml>.

### Comandos ejecutados y salidas

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec boxlang boxlang tests/extraction.bxs
OK: MD=bx-ai MarkdownLoader; TXT/code=bx-ai TextLoader; JSON=bx-ai JSONLoader; CSV=bx-ai CSVLoader; PDF=bx-ai PDFLoader + PDFBox page 2 exact citation; DOCX=secure XML tree; escaped ampersand decoded; ordered runs and paragraph 2 citation exact; XLSX=secure XML tree; Summary first/distractor 999, Limits second/target 250; shared-string entities decoded; XLSX rejects B0, missing cell refs, fractional/out-of-range shared indices and unsupported formulas
```

El mismo comando valida los archivos pequeños `locations-bad-ref.xlsx`, `locations-missing-ref.xlsx`, `locations-fractional-shared.xlsx`, `locations-out-of-range-shared.xlsx`, `locations-formula.xlsx`; son negativos y se espera que la suite termine `OK` tras verificar los rechazos.

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec -T boxlang boxlang tests/export-evidence.bxs > /tmp/opencode/second-brain-round3-export.stdout
python3 - <<'PY'
import json
from pathlib import Path
lines=Path('/tmp/opencode/second-brain-round3-export.stdout').read_text().splitlines()
data=json.loads(next(line for line in reversed(lines) if line.startswith('{')))
Path('frontend/app/evidence.generated.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
for d in data['documents']: print(d['id'],d['location']['start'],repr(d['location']['quote']),d['sha256'])
PY
```

```text
locations.md line 3/1 'repeat phrase' 6e94f4fd7a8865af9c3536129584c094213ddac1d14a3aedb8b266263078a939
locations.txt line 3/1 'Exact TXT target' d1f4268f5b0c65f20bb0de5f3b2fd152f0facd94401cbab9f2289350ad6d898e
locations.js line 3/16 'Exact CODE target' 75d709575b3c2195b7adfbe373f92fe6479b78dcd831146f8e4fc0bc91abea01
locations.jsondata policy.maxDays/1 '10' b502cec39bd90a8b6205dc7cebe66e2087d017a8fb0284b592566bfa1de99703
locations.csv row 3/1 '40' 156ab85684ab30d3cf84f37544ac276901e726b21dded047bea234abbf937018
locations.pdf page 2/1 'For urgent purchases, attach prior authorization.' 0a60abb347fab948b25ac7008763d7b7832ac726e50b19de53bc25478a6641f5
locations.docx paragraph 2/1 'Exact DOCX & target' 1ad8b91b3116e3f17fc884615aa43b01f7ec6cc5a23a15588ca14d62a5ab600f
locations.xlsx Limits!B2/1 '250' cd385cef693805150e011b403d7e62ac1c5030d6c0e614207c520adf0cfd0a2e
```

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec frontend node /tests/contracts.mjs
OK: 8 BoxLang-exported source hashes/coordinates; DOCX repeated paragraph; stale-export and range guards; JSON/CSV exact citations and invalid-path/row/kind negatives; 20 frozen cases
```

Esto incluye hash `.b64`↔binario, hashes R04/R07, A04 evidencia vacía y fuente excluida, R05/R06 exactas; negativos ejecutan el mismo resolver usado por las verificaciones manifest.

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec frontend pnpm lint
$ eslint
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec frontend pnpm exec tsc --noEmit
(exit 0, sin salida)
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec frontend pnpm build
✓ Compiled successfully; TypeScript finished; static /_not-found and dynamic / generated
```

Browser puntual en `http://127.0.0.1:3001/`, control nativo real: **DOCX** enseña `paragraph2 = ⟦Exact DOCX & target⟧` y paragraph3 repetido sin marca, label `párrafo 2 · offset 1`; prueba la decodificación y posición. **XLSX** enseña label `hoja Limits · celda B2 · offset 1`, `Limits!B2 = ⟦250⟧`; `Summary` es la hoja 1/distractor (999) y la extracción confirma target desde hoja 2. Interacción seleccionada por teclado usando select (`End` + `Enter`) también conserva la marca XLSX. No se hizo prueba de proveedor ni tráfico fuera de local.

### Estado/commit

La ronda corrige los defectos locales del reporte Sol; no convierte la rúbrica en una evaluación final de fase 06 ni aprueba Office universal. Estado **Bloqueada** hasta clave y tarifas autorizadas para llamadas reales, prueba de modelo/embedding/uso/coste y revisión independiente. Commit de implementación estable: `29ea429` (`fix: close phase 00 round 3 review findings`). Este registro de evidencia queda en commit docs-only posterior. Los planes untracked preexistentes siguen fuera del commit. Sin push/merge ni traslado al repositorio original.

## Ronda de corrección 4/5 — N7/N9 XLSX

Se corrigieron los dos hallazgos locales de `sol-rereview-3.md` en el punto compartido `EvidenceExtractor.xlsxCells`. N7 concatena los nodos `<t>` descendientes de `<is>` en orden XML usando `XMLText`, como la rama de shared strings. N9 valida el tipo contra el subconjunto admitido (`n`, `s`, `b`, `e`, `str`, `inlineStr`) antes de consultar o leer `<v>`.

### Evidencia por finding

| Finding | Corrección y check |
|---|---|
| N7 — inline rich runs | `tests/fixtures/locations-inline-runs.xlsx.b64` contiene un XLSX ZIP con `A ` y `&amp; B` en dos runs inline. `tests/extraction.bxs` materializa el ZIP en `/tmp` y llama el método completo `xlsxCells`; exige el valor literal `A & B`. |
| N9 — tipo desconocido con `<v>` | `tests/fixtures/locations-unsupported-value.xlsx.b64` contiene una celda `t="unsupported"` con `<v>250</v>`. La misma llamada completa debe rechazarla con `Unsupported XLSX cell type unsupported at A1`. |

### Comandos ejecutados y salidas

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec -T boxlang boxlang tests/extraction.bxs
```

Salida observada:

```text
[2026-10-11T07:55:02,247] [main] [WARN ] [org.apache.pdfbox.pdmodel.font.PDType1Font] Using fallback font LiberationSans for Helvetica
[2026-10-11T07:55:02,258] [main] [WARN ] [org.apache.pdfbox.pdmodel.font.PDType1Font] Using fallback font LiberationSans for Helvetica
[2026-10-11T07:55:02,283] [main] [WARN ] [org.apache.pdfbox.pdmodel.font.PDType1Font] Using fallback font LiberationSans for Helvetica
[2026-10-11T07:55:02,285] [main] [WARN ] [org.apache.pdfbox.pdmodel.font.PDType1Font] Using fallback font LiberationSans for Helvetica
[2026-10-11T07:55:02,289] [main] [WARN ] [org.apache.pdfbox.pdmodel.font.PDType1Font] Using fallback font LiberationSans for Helvetica
OK: MD=bx-ai MarkdownLoader; TXT/code=bx-ai TextLoader; JSON=bx-ai JSONLoader; CSV=bx-ai CSVLoader; PDF=bx-ai PDFLoader + PDFBox page 2 exact citation; DOCX=secure XML tree; escaped ampersand decoded; ordered runs and paragraph 2 citation exact; XLSX=secure XML tree; Summary first/distractor 999, Limits second/target 250; shared-string entities decoded; XLSX inline rich-text runs concatenate to literal A & B through full ZIP extraction; XLSX rejects unsupported cell type before reading its <v> value; XLSX rejects B0, missing cell refs, fractional/out-of-range shared indices and unsupported formulas
```

```sh
git diff --check
# exit 0, sin salida
```

No se modificaron los fixtures principales `locations.xlsx` ni el manifest; por ello no se repitió `tests/contracts.mjs`. Smoke, UI, lint/build, proveedor y suites ajenas tampoco se repitieron: sus entradas permanecen sin cambios; no hubo claves, llamadas externas, cambios de fase 01 ni apagado. N7/N9 quedan **corregidos localmente y comprobados**; la fase global sigue **Bloqueada** por falta de key/tarifas autorizadas y evidencia del entorno externo. Pendiente revisión independiente de Sol.
