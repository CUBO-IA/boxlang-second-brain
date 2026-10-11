# Fase 00 — Viabilidad y decisiones de implementación

**Estado:** Verificada (2026-10-11). Cierre registrado en [evidence/phase00-closure.md](evidence/phase00-closure.md). **Dependencia:** ninguna. [Índice](README.md).

**Fuente:** [arquitectura](../specification/06-arquitectura-y-seguridad.md) y [validaciones técnicas previas](../specification/08-aceptacion-y-pendientes.md#validaciones-técnicas-previas).

## Qué se debe lograr

Demostrar que la base instalada puede cumplir los contratos críticos antes de diseñar tablas, endpoints o pantallas definitivas. Al terminar, debe saberse qué se reutiliza, qué adaptación mínima hace falta y qué está bloqueado. No basta con encontrar una función en la documentación.

## Trabajo ordenado

- [x] **00.1 — Línea base.** Compose + `tests/smoke.bxs` / `tests/http.mjs` operativos en la base integrada.
- [x] **00.2 — Respuestas reales.** Chat sintético validado desde bx-ai 3.5.0 con `gpt-6-luna`; ver [evidencia del probe](evidence/provider-phase00.md).
- [x] **00.3 — Embeddings.** `text-embedding-3-small` con **1.536** dimensiones observadas; almacenamiento pgvector correcto. Lectura vía `findSimilar` de bx-ai tiene parse científico residual (ver cierre).
- [x] **00.4 — Aislamiento vectorial.** Filtro por espacio/documentos antes de ranking adoptado como contrato (SQL/`metadata` antes de nearest-neighbor).
- [x] **00.5 — Ciclo vectorial.** Sustitución/borrado de vectores con metadatos cubierto en probes/diagnóstico local; residuos de parser documentados.
- [x] **00.6 — Extracción.** PDF/MD/TXT/JSON/código/DOCX/CSV/XLSX con ubicaciones en fixtures y contratos.
- [x] **00.7 — Navegación.** Coordenadas exportadas y comprobadas en visor de feasibility/contratos; grafo acotado pospuesto a fase 07 con viabilidad aceptada.
- [x] **00.8 — Contratos mínimos.** Contratos de documento/fragmento/ubicación/cita independientes de Next.js registrados en código y plan.
- [x] **00.9 — Fallos y operación.** Defaults de tareas, publicación, presupuesto y operación fijados abajo; hostname/TLS reales siguen en fase 08.
- [x] **00.10 — Evaluación.** Rúbrica/manifisto de 20 casos fijados en `tests/evaluation/manifest.json` antes de afinar prompts.

Las pruebas de proveedor necesitan una clave autorizada y presupuesto de validación. La prueba pequeña de esta fase se registra por separado; no se pretende que el control presupuestario de aplicación de fase 02 ya exista.

## Decisiones que deben quedar escritas

Completar esta tabla con resultado real y enlace a la evidencia. «Por decidir» bloquea la parte del diseño que dependa de esa decisión.

| Decisión | Resultado registrado | Estado |
|---|---|---|
| Modelo de respuestas | `gpt-6-luna` vía Chat Completions/`bx-ai`; uso y coste calculado en probe | Verificado |
| Embeddings | `text-embedding-3-small`; **1.536** dimensiones; pgvector almacena bien; evitar confiar en `findSimilar` para floats científicos | Verificado con residuo documentado |
| Recuperación | Filtrar espacio + documentos seleccionados **antes** del ranking | Verificado (contrato) |
| Vectores | Inserción/sustitución/borrado con metadatos; lectura canónica SQL si hace falta | Verificado |
| Extracción/particionado | Loaders por formato con ubicaciones; fragmentos ≤8.000 code points, solape 400, máx. 500/doc | Verificado |
| Visores/grafo | Coordenadas/fixtures + feasibility; grafo de producto en fase 07 | Verificado para arrancar |
| Procesamiento | Tareas en PostgreSQL, lease 60 s / heartbeat 15 s, fence por revisión | Verificado (defaults adoptados) |
| Límites | 50 MB/archivo, 20 archivos/op, 100 MB UTF-8 extraído, 1.000 docs/espacio | Verificado (defaults adoptados) |
| Presupuesto | USD 20/día UTC; reserva atómica; tarifas fechadas obligatorias | Verificado (defaults adoptados) |
| Operación/evaluación | Objetivos de carga/backup propuestos; TLS/host en fase 08; manifiesto de 20 casos fijado | Verificado para diseño; op. externa en 08 |

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio |
|---|---|---|
| P00.1 | Ejecutar pruebas existentes | Módulos, JDBC, pgvector y conexión Next.js→BoxLang operativos |
| P00.2 | Invocar ambos modelos con entrada sintética | Respuesta/embedding reales desde BoxLang AI, configuración y coste registrados |
| P00.3 | Buscar en A con datos más similares en B | Ningún fragmento de B es recuperado ni enviado al modelo |
| P00.4 | Sustituir/borrar un documento de A | Vectores viejos retirados, otros documentos intactos |
| P00.5 | Extraer y localizar evidencia por formato | Cada ubicación corresponde a contenido real y es representable en el visor |
| P00.6 | Revisar decisiones y diseño mínimo | Ninguna capacidad crítica asumida; bloqueos identificados y resueltos para avanzar |

## Entregables y criterio de finalización

- [x] Scripts pequeños reproducibles para las capacidades críticas, separados según consuman o no API externa.
- [x] Tabla anterior completada, contratos y diseño mínimo de datos/operaciones documentados, sin secretos ni documentos privados.
- [x] Evidencia de viabilidad y [registro de cierre](evidence/phase00-closure.md).
- [x] Bloqueos que afectaban el arranque de fases siguientes cerrados o degradados a residuos documentados (parser `findSimilar`, op. externa en fase 08).

## Ejecución de Task 1

Resultados históricos: [informe Task 1](../../.superpowers/sdd/00-viabilidad-y-decisiones/task-1-report.md). Probe: [evidencia del proveedor](evidence/provider-phase00.md). Cierre: [phase00-closure.md](evidence/phase00-closure.md).

## Defaults adoptados para implementación

| Área | Decisión provisional | Límite/recuperación |
|---|---|---|
| Ingesta | 20 archivos/operación; 50 MB = 50,000,000 bytes/archivo; máximo total 100 MB = 100,000,000 bytes de UTF-8 extraído. No truncar | Rechazar comprimidos en fase 00; si se habilitan, máximo 100 MB = 100,000,000 bytes expandidos y 10,000 entradas. Límites futuros a validar con cargas reales |
| Fragmentos | Máximo 8,000 Unicode code points, solape 400 code points, máximo 500 fragmentos/documento | Fallar y conservar versión vigente si excede; sin publicación parcial |
| Tareas | Tabla PostgreSQL futura como registro durable, lease 60 s con heartbeat cada 15 s; sin cola adicional | 3 intentos automáticos con backoff 1/5/15 min; reintento manual posterior. Fence por versionId impide publicar trabajo obsoleto |
| Original + DB | Versiones inmutables y estados `staging → stored → ready`; `ready` solo tras rename atómico y hash coincidente | Al reinicio reconciliar `stored`: staging existente se renombra; destino con hash esperado se promueve a `ready`; archivo ausente/mismatch falla nueva versión y retiene la ready anterior. Temporales huérfanos >24 h se eliminan. Borrado marca tombstone, elimina derivados/original y se reanuda idempotentemente |
| IA | USD 20/día UTC, según especificación | Reserva atómica concurrente antes de llamada; liquidar con uso real; ante uso desconocido retener reserva hasta conciliación; detener al agotar. Tarifas del modelo con fecha son requisito de configuración: sin tarifa no llamar ni estimar |
| Operación/backups | Acceso privado tras TLS; backup diario consistente de PostgreSQL + manifiesto/hash + originales inmutables; cifrado AES-256-GCM antes de salir del volumen | Retención propuesta: 7 diarios, 4 semanales, 12 mensuales. Clave de cifrado fuera del repo/en gestor de secretos; restore conjunto trimestral. RPO 24 h/RTO 4 h propuestos, no medidos |
| Carga | 1,000 docs/espacio; 30 sesiones concurrentes; muestra de texto de 1 MB = 1,000,000 bytes y archivo máximo 50 MB = 50,000,000 bytes | Objetivo p95 pregunta ≤30 s; indexación de 1 MB ≤60 s. Archivos 1–10 MB ≤2 min; >10–25 MB ≤5 min; >25–50 MB ≤10 min. Registrar bins 1/2/5/10/25/50 MB, CPU/RAM, conexión y proveedor. Son objetivos candidatos, no medidos; hardware/host/dominio siguen desconocidos |

Estos valores quedan **adoptados como decisiones de fase 00** para implementar fases 02+. Siguen siendo objetivos de diseño (no benchmarks medidos en hardware de producción). Hostname/dominio y TLS reales se confirman en fase 08.

### Registro de cierre

```text
Fase y estado: 00 — Verificada
Fecha / responsable: 2026-10-11 / equipo (confirmación: fase 00 implementada) + bookkeeping en repo
Revisión de código y cambios locales evaluados: base main eea2a7d (phase 00 viability + phase 01)
Entorno y versiones: Docker Compose, BoxLang 1.18.0, bx-ai 3.5.0, PostgreSQL/pgvector
Datos sintéticos utilizados: fixtures locations.* y probes documentados
Comandos y comprobaciones de navegador: smoke.bxs, http.mjs; feasibility/contratos de fase 00
Resultados: aprobados para cierre de viabilidad; residuos findSimilar/TLS documentados
Modelo, configuración, consumo y coste (si aplica): ver evidence/provider-phase00.md
Evidencias o informe: evidence/phase00-closure.md, evidence/provider-phase00.md
Bloqueos pendientes: ninguno que impida fase 02; operación externa → fase 08
```

**No se construye aquí:** la aplicación completa de negocio. **Siguiente:** [fase 01](01-cuentas-espacios-y-permisos.md) (ya Verificada) → [fase 02](02-biblioteca-tareas-y-presupuesto.md).
