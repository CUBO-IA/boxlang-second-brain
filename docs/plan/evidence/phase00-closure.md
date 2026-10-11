# Fase 00 — cierre técnico y evidencia

Fecha: **2026-10-11**. Implementación reutilizada: rama `phase00-finish`, commits `aea03632a2f56c9c32acf9151ad63bc4349aa938` y `b27ebffcdc9c0c1839ba8d137232f2d7d869f952`, sobre `eea2a7dfcb53a5a9a192b1ae4bd9234072ad9c35`. Integración en la carpeta original, proyecto Compose `second-brain`. La fase 01 permanece Verificada; no se implementan fases 02–09.

## Causa raíz y corrección

`PostgresVectorMemory.parseVectorString()` de bx-ai `3.5.0+19` usaba `val()`: `val("1e-6")` produce `1`, aunque PostgreSQL conserva `0.000001`. `findSimilar`, `getById` y `getAllDocuments` comparten ese parser. La regresión en la imagen original reprodujo `getById dimension 1 expected exact PostgreSQL value 0.000001, got 1` y terminó con código 1.

El parche de `docker/patches/bx-ai-3.5.0-scientific-vectors.sh` cambia únicamente `val` por `toNumeric` durante el build, después de instalar desde `box.json`. Exige versión exacta `3.5.0+19` y una única línea fuente coincidente; un mismatch aborta. No modifica módulos de un contenedor activo ni introduce otro store/adaptador. La regresión contrasta las 1.536 coordenadas de `getById` y `findSimilar` con la representación canónica de PostgreSQL, con igualdad exacta; entrada→float32 usa tolerancia relativa `1e-6`, sin suelo absoluto.

Fuentes: [bx-ai, Apache-2.0](https://github.com/ortus-boxlang/bx-ai), [ForgeBox](https://forgebox.io/api/v1/entry/bx-ai), [ToNumeric](https://boxlang.ortusbooks.com/boxlang-language/reference/built-in-functions/conversion/tonumeric). La referencia documenta conversión numérica; la aceptación de exponentes queda demostrada por la prueba, no por una afirmación de aquella página. La comprobación histórica de releases no encontró estable corregido. Retirar el parche al fijar un release upstream que pase esta regresión.

El error ad-hoc histórico `Named parameter [:text] not provided to query` no se reproduce con `storeDocument`: tanto la regresión como `tests/probe.bxs` usan esa API real. No se sustituye la escritura por SQL.

## Proveedor: evidencia reutilizada, sin llamadas nuevas

El [histórico del proveedor](provider-phase00.md) contiene cuatro llamadas y USD **0.00001244** estimados. El seguimiento registrado en `aea0363` ejecutó una sola vez `tests/provider.bxs` en Compose `second-brain-phase00-finish`, con opt-in manual, timeout 30 s, cero retries, `reasoning_effort=none`, salida máxima 32 tokens y techo USD 1:

| Operación | Modelo / endpoint | Resultado | Uso | Coste por tarifa |
|---|---|---|---|---:|
| Chat | `gpt-6-luna`, `/v1/chat/completions` | `P00_PROVIDER_PROBE_OK`, `finish_reason=stop` | 16 entrada + 9 salida | USD 0.00000610 |
| Embedding | `text-embedding-3-small`, `/v1/embeddings` | 1.536 dimensiones; vector real insertado/recuperado vía bx-ai, un resultado dentro de tolerancia | 6 tokens | USD 0.00000012 |

Tarifa Standard fechada 2026-10-11: chat USD 0.10/M entrada y 0.50/M salida, embedding USD 0.02/M. Seguimiento: **USD 0.00000622**; acumulado: **seis llamadas, USD 0.00001866** estimados. Máximo conservador acumulado USD 0.00007104 < USD 1. Uso/tarifas no equivalen a conciliación de facturación. No se conserva ni se afirma haber inspeccionado el log temporal externo; se acepta la evidencia sanitizada y su revisión anterior. Esta integración no requiere repetir llamadas ni leer claves.

## Matriz de loader, vista, coordenadas y límites

Se adopta el subset probado de loaders bx-ai y adaptación ZIP/XML existente. No se exige entitlement premium ni se afirma soporte Office universal. Todos los originales están limitados a 50,000,000 bytes; los assets públicos son únicamente fixtures sintéticos fijos, nunca documentos de usuarios.

| Formato | Loader → vista / ubicación | Dependencia y licencia | Límite de viabilidad |
|---|---|---|---|
| PDF | bx-ai `PDFLoader` + `EvidenceExtractor.pdfPages` → original en React-PDF, página 2 y quote validado contra offsets del extractor; `<mark>` en text layer | bx-ai/PDFBox Apache-2.0; React-PDF `10.1.0` MIT; PDF.js `5.3.93` Apache-2.0 | Fixture de dos páginas, cita única en un text item; falla sin simular highlight si es ambigua. Sin OCR ni anotaciones |
| Markdown | bx-ai `MarkdownLoader` → React Markdown; línea 3 y offsets fuente absolutos del AST localizan la segunda frase repetida | bx-ai Apache-2.0; react-markdown `10.1.0` MIT | Fixture plano; no generaliza mapping tras transformaciones arbitrarias. `skipHtml`, enlaces/imágenes inertes, URLs eliminadas; sin HTML crudo |
| TXT | bx-ai `TextLoader` → texto con marca en línea/offset exactos | bx-ai Apache-2.0; React/DOM nativos | Texto sin transformación visual |
| Código | bx-ai `TextLoader` → línea/rango en texto, nunca ejecución | bx-ai Apache-2.0; React/DOM nativos | Sin highlighter propio; lenguajes/visor final en fase 04 |
| JSON | bx-ai `JSONLoader` + parseo estructural → `policy.maxDays`, distinto de scalar repetido en otra ruta | bx-ai Apache-2.0; `jsonDeserialize`/React nativos | Coordenadas probadas; árbol nativo final y objetos/arrays complejos en fase 04 |
| DOCX | `EvidenceExtractor.docxParagraphs` ZIP/XML → párrafos normalizados, cita en párrafo 2 | ZIP/XML Java, sin módulo premium | ≤10.000 entradas ZIP, XML ≤1 MB/parte; rechaza tabs, breaks, drawings/objects e instrucciones de campo; sin fidelidad Office |
| CSV | bx-ai `CSVLoader` + representación de filas/celdas → fila 3, columna `limit` | bx-ai Apache-2.0; tabla/React nativos | Export de fixture sin campos entrecomillados; dialectos/escapes y tabla final en fase 04 |
| XLSX | `EvidenceExtractor.xlsxCells`, workbook→relaciones→hoja, shared/inline strings → `Limits!B2` | ZIP/XML Java, sin módulo premium | ≤10.000 entradas ZIP, XML ≤1 MB/parte; rechaza fórmulas/referencias/tipos fuera del subset; tabla y selector finales en fase 04 |

`tests/viewer-fixtures.mjs` contrasta hashes de assets con originales, quote/offsets Markdown y página PDF no inicial. Next.js carga el PDF solo en navegador (`dynamic`, `ssr:false`), con worker local y versiones fijadas en el lockfile. Se consultaron las guías de la versión instalada en `node_modules/next/dist/docs/01-app/` y documentación React-PDF `10.1.0` mediante Context7.

La expansión del grafo sintético existente demuestra deduplicación, teclado y tope de ocho nodos; no demuestra relaciones respaldadas por DB, entregadas en fase 07. El visor privado, la autorización de originales, la ingesta y todas las vistas finales siguen siendo requisitos de fases posteriores.

## Contratos mínimos y operaciones

El núcleo es Pure BoxLang, independiente de Next.js/HTTP. Solo `Document` y `Location` están materializados; no se crean clases vacías ni tablas de negocio para el futuro.

| Contrato | Campos / persistencia futura |
|---|---|
| Document | `id, spaceId, name, mediaType, version, status, metadata`; `documents`, referencia privada a original inmutable |
| Fragment | `documentId, version, ordinal, text, hash, embedding, metadata`; pgvector integrado por bx-ai |
| Location | `kind, start, end, quote`; validar contra texto extraído |
| Citation | `fragmentId, documentVersion, location`; revalidar permiso, espacio y vigencia al abrir |
| Answer | `text, claimLabels, citations, abstentionReason`; cada afirmación respaldada/inferida/incierta |
| Conversation | `id, spaceId, owner, turns`; conversaciones/mensajes privados por defecto |
| Task | `id, documentId, versionId, state, attempts, errorCategory`; registro durable y fence |
| Relation | `spaceId, typedEndpoints, type, evidence, metadata`; procedencia de similitud/concepto/referencia |

Recuperación: bx-ai recibe filtros de espacio/documento en `WHERE` antes de `ORDER BY/LIMIT`; selección múltiple consulta cada documento autorizado y combina score/top-k sin duplicados. Selección vacía devuelve contexto vacío. Es prueba del mecanismo, no una llamada RAG productiva ni autorización completa del dominio futuro.

Publicación: original inmutable en staging, registro `stored`, rename atómico + SHA-256 antes de `ready`; reconciliar `stored` al reiniciar. Un reemplazo conserva `ready` anterior hasta publicar; borrado tombstone/idempotente limpia derivados sin afectar hermanos.

## Operación y evaluación

- Perfil candidato de medición: **4 vCPU, 8 GiB RAM, SSD ≥100 GB**; no hardware adquirido ni capacidad certificada. 1.000 documentos/espacio y 30 sesiones, cinco minutos de calentamiento + 30 medidos, 100 preguntas para p95 y cinco archivos por bin 1/2/5/10/25/50 MB. Registrar errores/timeouts, IA/coste, CPU/RAM/IO/red y percentiles; cargas reales requieren autorización aparte.
- Acceso propuesto: VPN WireGuard privada y proxy HTTPS con CA confiable; autenticación de aplicación obligatoria, DB/puertos no públicos. Host, DNS privado, confianza de CA y aprobación para instalar infraestructura corresponden a fase 08.
- Tareas: PostgreSQL durable, lease 60 s/heartbeat 15 s, tres intentos con backoff 1/5/15 min, después manual; fence por versión, sin cola adicional.
- Límites: 20 archivos/operación; 50 MB/archivo, 100 MB UTF-8 extraídos; 8.000 code points/fragmento, solape 400, 500 fragmentos/documento. MB decimal; exceso falla sin truncar y conserva versión vigente; comprimidos rechazados.
- Descargas futuras: conexión ≤10 s y tiempo total ≤30 s por recurso, máximo tres redirecciones, 50 MB por respuesta y 100 MB acumulados por operación, también al descomprimir. Validar destino/DNS y cada salto antes de acceso; sin recursos secundarios, rastreo ni JS. Son defaults de diseño para fase 05, no una descarga ni protección SSRF ya implementada.
- Presupuesto: USD 20/día UTC, reserva atómica antes de llamadas concurrentes, liquidar por usage real, retener reserva ante uso desconocido y detener nuevas llamadas al agotarse. Sin tarifa fechada no llamar; implementación en fase 02.
- Backup propuesto: diario 02:00 UTC, pausar escrituras, snapshot conjunto de DB y originales referenciados con manifiesto/hash, publicar solo conjunto completo y cifrar AES-256-GCM antes de salir del volumen. Clave fuera del repo; retención 7 diarias/4 semanales/12 mensuales; restore aislado trimestral. RPO 24 h/RTO 4 h no medidos. `ponytail:` pausa global durante backup; usar pinning por versión si excede ventana operativa.
- Objetivos candidatos: pregunta p95 ≤30 s; 1 MB indexado ≤60 s; >1–10 MB ≤2 min, >10–25 MB ≤5 min, >25–50 MB ≤10 min. No se ejecutó benchmark ni despliegue/backups.
- Evaluación: `tests/evaluation/manifest.json` congela R01–R10, C01–C04, D01–D02, A01–A04, fuentes/versiones/coordenadas y gates 18/20, cero abstenciones críticas/falsos conflictos, todas las citas válidas y aislamiento aprobado. `tests/contracts.mjs` comprueba preparación, no evaluación semántica de fase 06.

## Verificación en la carpeta original

Los resultados de integración y el veredicto final se registran en [revisión de fase 00](phase00-review.md). Comandos reproducibles sin consumo IA:

```sh
docker compose up -d --build --wait
docker compose exec -T boxlang boxlang tests/smoke.bxs
docker compose exec -T boxlang boxlang tests/vector-roundtrip.bxs
docker compose exec -T boxlang boxlang tests/probe.bxs
docker compose exec -T frontend node --input-type=module < tests/http.mjs
docker compose exec -T frontend pnpm lint
docker compose exec -T frontend pnpm exec tsc --noEmit
docker compose run --rm --no-deps -v "$PWD:/repo:ro" -w /repo frontend node tests/viewer-fixtures.mjs
```

El último script usa rutas de la raíz del repo: se monta en modo solo lectura y no lee `.env`. Cada prueba vectorial crea/elimina solo su tabla UUID en `finally`; pruebas de cuentas limpian exclusivamente el slug sintético de esta ejecución. `.env`, otros worktrees/proyectos/volúmenes y las fases 02–09 no se modifican.
