# Task 1 — Fase 00, informe de ejecución

## Resumen y estado

**Estado de fase: Bloqueada; pendiente de verificación independiente.** No se declara verificada ninguna puerta que requiera ejecución real o evidencia no disponible. Se respetó el Compose separado `second-brain-phase00` y no se efectuó ninguna llamada externa: no hay clave OpenAI configurada y el harness no se usa como credencial. No se crearon tablas de aplicación ni se tocaron volúmenes del proyecto original.

Revisión base: `844463a` (`docs: add second brain product specification`). Branch: `phase00-viability`. Revisión de implementación: `5b8ec39` más el commit de corrección/documentación siguiente. Versiones efectivas observadas: BoxLang `1.18.0+66`; PostgreSQL `17.11`; extensión pgvector `0.8.7`; Next.js `16.4.0`. Descriptor fija `bx-ai 3.5.0` y `bx-postgresql 1.2.0`, pero no se logró obtener sus versiones activas del runtime (módulos constan activos según smoke). Docker construyó imágenes e inició los tres servicios del proyecto aislado `second-brain-phase00` en puertos 3001/8081/55434; volumen dedicado `second-brain-phase00_postgres_data`.

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

La primera ejecución del probe falló por resolución de clase y sintaxis/parámetros SQL; se corrigió añadiendo classPath del backend, `jsonb_build_object`, `IN` enlazado y `CAST(... AS vector)`. El resultado final citado es la ejecución posterior exitosa. El fallo anterior no se oculta.

```sh
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec boxlang boxlang tests/smoke.bxs
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec -T frontend node --input-type=module < tests/http.mjs
FRONTEND_PORT=3001 BACKEND_PORT=8081 POSTGRES_PORT=55434 docker compose -p second-brain-phase00 exec boxlang boxlang tests/probe.bxs
node tests/contracts.mjs
```

Las pruebas existentes `tests/smoke.bxs` y `tests/http.mjs` se conservaron sin cambios. La prueba BoxLang `tests/probe.bxs` crea una tabla temporal de sesión de nombre aleatorio y comprueba filtro de espacio + documentos dentro de la consulta, reemplazo de metadatos, borrado y conservación del documento hermano. Solo prueba pgvector PostgreSQL directamente, no bx-ai Memory API. `node tests/contracts.mjs` pasó localmente: `OK: deterministic fixture location contract and repeated-value content assertions`. `git diff --check` pasó.

Consulta de documentación oficial BoxLang AI realizada vía MCP: la búsqueda indica carga de diversos formatos, API de embeddings y loaders, pero no entregó referencia de API precisa para operaciones de memoria Postgres ni ubicación. Esto no demuestra capacidad de la versión instalada. No se encontró `.codegraph/` pertinente.

## Estado 00.1–00.10

| Ítem | Resultado honesto |
|---|---|
| 00.1 Línea base | Verificado localmente: Compose aislado healthy; smoke y HTTP pasaron. Versiones efectivas de BoxLang, PostgreSQL, pgvector y Next anotadas; versión efectiva exacta de módulos no recuperada. |
| 00.2 Respuesta `gpt-6-luna` | Bloqueada: no hay clave; ninguna petición. Prueba opt-in preparada, pero bloquea si no hay consentimiento, techo USD ≤1 y clave. El mecanismo exacto bx-ai 3.5.0 aún no confirmado; prueba se detiene antes de solicitar. |
| 00.3 Embeddings/1.536 | Bloqueada: sin clave no se generó embedding. No se creó esquema de negocio ni se confirma dimensión. |
| 00.4 Aislamiento | Probe SQL temporal pasó: espacio y documento seleccionados filtran dentro de recuperación. No prueba integración vectorial bx-ai ni exposición a un modelo real. |
| 00.5 Ciclo vectorial | Probe SQL temporal pasó replace/metadata/delete y hermano preservado. No confirma API de bx-ai. |
| 00.6 Extracción | Bloqueada/incompleta: fixtures de texto deterministas; no se incluyeron binarios DOCX/XLSX falsos. PDF, DOCX y XLSX no probados; loaders/dependencias/localización no confirmados. |
| 00.7 Navegación/grafo | Bloqueada: no se agregaron bibliotecas sin prueba ni visor/grafo; no hay ubicaciones reales para validar. |
| 00.8 Contratos | Parcial: `Document` y `Location` son clases BoxLang mínimas; mapa completo de contratos/operaciones propuesto abajo. Fragmento, cita, respuesta, conversación, tarea y relación aún no implementados como clases. |
| 00.9 Fallos/operación | Propuesta documentada abajo; configuración real de hardware, endpoint HTTPS, backups y carga desconocida. |
| 00.10 Evaluación | Manifiesto fijo de 20 casos preparado en la sección siguiente a partir de R01–R10/C01–C04/D01–D02/A01–A04; criterios fijados antes de prompts. No ejecutado. |

## Puertas P00

| Puerta | Estado |
|---|---|
| P00.1 | Parcial: smoke confirma módulos/JDBC/pgvector; HTTP confirma Next→BoxLang. Aprobada para la línea base ejecutada. |
| P00.2 | Bloqueada sin clave; no hay éxito simulado ni proveedor alternativo. |
| P00.3 | Parcial: filtro de espacio/selección probado dentro de consulta SQL; no se hizo respuesta real ni prueba de payload enviado al modelo. |
| P00.4 | Probe pasó reemplazo/borrado/metadata y preservación de sibling en tabla temporal. Integración bx-ai pendiente. |
| P00.5 | Bloqueada: faltan fixtures binarios válidos y extracción/localización/visor por formato. |
| P00.6 | Parcial: gaps identificados; no resueltos, por tanto no pasa. |

## Contratos mínimos y persistencia propuesta

`Document`: id, spaceId, nombre, mediaType, version, status, metadata. `Fragment`: documentId/version, ordinal, texto, hash, embedding y metadata. `Location`: tipo, coordenadas inicial/final, cita literal. `Citation`: fragmentId, document version y location; validar existencia, texto y versión vigente al abrir. `Answer`: texto, etiquetas (respaldado/inferido/incierto), citations y abstention reason. `Conversation`: id, spaceId, owner y turnos; `Task`: id, documentId/version, estado, intentos explícitos y error categorizado; `Relation`: espacio, extremos tipados, tipo, evidencia y metadata.

Tablas futuras mínimas: spaces/members (fase posterior de permisos), documents, fragments (pgvector), conversations/messages, tasks, relations; no crear en fase 00. Operaciones: filtrar espacio + selección documental antes de nearest-neighbor; upsert/reemplazo atómico de versión; retirar derivados y marcar cita histórica obsoleta al borrar/reemplazar; validar permiso al servir original/cita/grafo. El contrato de dominio no depende de Next.js ni HTTP. La integración pgvector de bx-ai debe preferirse si pasa aislamiento y lifecycle; evitar duplicar tabla/adaptador sin evidencia.

## Extracción y navegación

No se ha probado loader real de ninguno de los ocho formatos. Fixtures incluidos: Markdown, TXT, JSON (`policy.maxDays` duplicado en otra ruta), código y CSV; valores repetidos deliberadamente. El pequeño test Node afirma contenido y rutas contractuales, no simula extracción. Ubicación mínima requerida: texto/código línea y offsets; PDF página + offsets; JSON path; CSV fila/columna; XLSX hoja/celda; DOCX párrafo/offset. PDF/DOCX/XLSX precisan fixtures válidos y extracción de coordenadas; toda evidencia actual insuficiente para aprobar formato.

Visores: no se eligieron dependencias; inspección de `frontend/package.json` no muestra una biblioteca específica de documento/grafo, solo React/Next/Tailwind. No se incorporó paquete. Licencias y límites quedan por revisar al seleccionar tras prueba. Grafo acotado recomendado: cargar vecinos directos con límite fijo por expansión, deduplicar nodos/aristas y no descargar el espacio completo; interacción teclado/lector de pantalla por validar.

## Política operativa propuesta (no medida)

- Tareas: tabla PostgreSQL persistente y reclamación con lease/estado, reintento explícito; no introducir cola. Asegurar fence por versión para que trabajo obsoleto no publique. A confirmar con carga.
- Consistencia archivo/DB: escribir original con nombre temporal privado, validar hash/metadata, confirmar registro/versionado y luego publicar atómicamente; al fallo conservar versión anterior y limpiar solo temporales propios. Borrado con tombstone/reconciliación antes de retirar archivo, sin éxito parcial presentado como listo. A diseñar en fase de implementación.
- Límites existentes acordados: 50 MB por archivo, 1.000 documentos/espacio, 30 usuarios simultáneos; son objetivos, no medidos. Pendiente fijar cantidad importada, expansión comprimida, fragmentos, tiempo y rechazo explícito (sin truncamiento silencioso).
- Presupuesto de proveedor: USD 20 por día UTC propuesto por spec; estimación por tarifas/versiones fechadas, reserva transaccional atómica antes de llamadas concurrentes, contabilizar cargos/errores y detener nuevas operaciones al agotar. Todavía no implementado; saldo externo de clave no queda cubierto.
- Servidor: despliegue Compose privado; HTTPS en proxy/terminador TLS de infraestructura privada antes de exponer. Dominio/host, CPU/RAM y concurrencia física desconocidos.
- Backups: PostgreSQL y volumen original coordinados con manifiesto/hash o snapshot coherente; ensayar restauración conjunta, cifrar y restringir acceso. Frecuencia/RPO/RTO no definidos.
- Carga: fijar hardware, dataset sintético, concurrencia, conexión, límites de API y tamaño antes de medir: objetivo spec p95 pregunta estándar ≤30s, texto ≤1MB indexado ≤60s. Archivos >1MB y hasta 50MB requieren objetivos por tamaño.

## Manifiesto y rúbrica fija (20)

Casos: R01–R10, C01–C04, D01–D02, A01–A04, exactamente los escenarios/fuentes definidos en `docs/plan/06-contradicciones-y-evaluacion.md`. Cada ejecución debe fijar pregunta, espacio, selección de documentos, idioma, IDs/versiones de fuentes y ubicaciones admisibles. R01–R10: respuesta semánticamente correcta, citas exactas admisibles, etiquetas de respaldo/inferencia correctas. C01–C04: ambas partes y contexto, sin ganador automático. D01–D02: contextos distintos explícitos, ningún conflicto falso. A01–A04: abstención segura, motivo informativo y cero evidencia no seleccionada, obsoleta o de otro espacio. Un caso pasa solo si satisface todos sus criterios estructurales/semánticos; mínimo global 18/20 y simultáneamente cero fallo crítico de abstención, cero conflicto falso, todas las citas verificables y aislamiento/permisos aprobados. Evidencia admisible: texto/versiones fixture congelados y coordenadas reproducibles; la prosa del modelo no demuestra fuente. Preparación no equivale a ejecución fase 06.

## Cambios de esta tarea y auto-revisión

- Añadidos `backend/secondBrain/{Document,Location,Probe}.bx`; scripts `tests/probe.bxs`, `tests/provider.bxs`, test Node `tests/contracts.mjs` y fixtures textuales/ubicación.
- Actualizada únicamente la línea de estado/enlace de `docs/plan/00-viabilidad-y-decisiones.md`; no se editó el resto de `docs/plan` copiado sin seguimiento.
- Ninguna dependencia, tabla persistente, secreto, binario inventado, proveedor alternativo ni credencial de harness.
- Hallazgos pendientes antes de merge/cierre: el probe SQL debe compilarse/ejecutarse en el runtime real (especialmente lista JDBC `ANY(:docs)`); confirmar estrategia/capacidades bx-ai 3.5.0; proveer acceso aprobado para modelo; crear fixtures PDF/DOCX/XLSX reales; completar clases restantes y visor solo tras resolver ubicaciones. Self-review: no declarar el probe como prueba del módulo; tabla TEMP se elimina en finally, y filtros están en query. Sol debe revisar independientemente y decidir bookkeeping final.
