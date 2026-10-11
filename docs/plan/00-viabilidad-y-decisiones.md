# Fase 00 — Viabilidad y decisiones de implementación

**Estado:** Verificada para el alcance de viabilidad acotada. Sol revisó el follow-up preexistente `b27ebff` y comprobó la integración en la carpeta original el 2026-10-11; I1/I2/M1/M2 cerrados en el [registro de revisión](evidence/phase00-review.md). No equivale a implementar fases 04/07/08. **Dependencia:** ninguna. [Índice](README.md).

**Fuente:** [arquitectura](../specification/06-arquitectura-y-seguridad.md) y [validaciones técnicas previas](../specification/08-aceptacion-y-pendientes.md#validaciones-técnicas-previas).

## Qué se debe lograr

Demostrar que la base instalada puede cumplir los contratos críticos antes de diseñar tablas, endpoints o pantallas definitivas. Al terminar, debe saberse qué se reutiliza, qué adaptación mínima hace falta y qué está bloqueado. No basta con encontrar una función en la documentación.

## Trabajo ordenado

- [x] **00.1 — Línea base.** Compose, módulos, JDBC, pgvector y Next.js→BoxLang probados; integración original en [registro de revisión](evidence/phase00-review.md).
- [x] **00.2 — Respuestas reales.** Chat sintético validado desde bx-ai 3.5.0 con `gpt-6-luna`; respuesta, endpoint, configuración, uso y coste calculado registrados en [evidencia del probe](evidence/provider-phase00.md).
- [x] **00.3 — Embeddings.** Embedding real de 1.536 dimensiones y roundtrip pgvector acreditados tras el parche del parser compartido de bx-ai; regresión científica reproducible sin IA.
- [x] **00.4 — Aislamiento vectorial.** B era el vecino más cercano y quedó excluido por filtros previos al ranking; selección múltiple/vacía probada con bx-ai real.
- [x] **00.5 — Ciclo vectorial.** Dos fragmentos reemplazados/eliminados, metadatos correctos y documentos hermano/B intactos; limpieza por tabla UUID.
- [x] **00.6 — Extracción.** Ocho fixtures reales, loaders/adaptación ZIP/XML acotada, ubicaciones y límites en la [matriz de evidencia](evidence/phase00-closure.md#matriz-de-loader-vista-coordenadas-y-límites). No acredita Office universal.
- [x] **00.7 — Navegación.** Mecanismo PDF original página 2/Markdown renderizado con cita repetida, vistas normalizadas y expansión sintética acotada. Licencias/límites en la matriz; visor privado completo y grafo DB en fases 04/07.
- [x] **00.8 — Contratos mínimos.** Ocho contratos y operaciones/tablas documentados en [cierre](evidence/phase00-closure.md#contratos-mínimos-y-operaciones), independientes de Next.js/HTTP.
- [x] **00.9 — Fallos y operación.** Tareas, consistencia, límites, reserva UTC, perfil candidato, HTTPS/backup y protocolo de carga decididos; despliegue/medición pendientes de fase 08.
- [x] **00.10 — Evaluación.** Manifiesto congelado de 20 casos, evidencias/gates y check ejecutable; no equivale a evaluar fase 06.

Las pruebas de proveedor necesitan una clave autorizada y presupuesto de validación. La prueba pequeña de esta fase se registra por separado; no se pretende que el control presupuestario de aplicación de fase 02 ya exista.

## Decisiones que deben quedar escritas

Completar esta tabla con resultado real y enlace a la evidencia. «Por decidir» bloquea la parte del diseño que dependa de esa decisión.

| Decisión | Resultado / evidencia | Estado actual |
|---|---|---|
| Modelo de respuestas | Acceso a `gpt-6-luna`, Chat Completions compatible con `bx-ai`, respuesta exacta y uso; coste calculado, no conciliado con cuenta | Verificado en probe sintético |
| Embeddings | `text-embedding-3-small`, 1.536 dimensiones; bx-ai real inserta/recupera tras parche reproducible de `val`→`toNumeric` | Verificado para probe |
| Recuperación | Filtros espacio/documento en `WHERE` antes del ranking; selección múltiple combina/deduplica top-k por documento | Verificado para mecanismo |
| Vectores | `storeDocument`, `getById`, `findSimilar`, reemplazo/borrado y conservación de hermanos | Verificado |
| Extracción/particionado | Subset de loaders bx-ai + ZIP/XML Office existente, coordenadas y rechazos en la matriz; defaults de fragmentos abajo | Viabilidad acotada; producto posterior |
| Visores/grafo | React-PDF/PDF.js original; react-markdown seguro con offsets; DOM nativo para estructura/tablas; expansión sintética de 8 nodos | Viabilidad acotada; fases 04/07 pendientes |
| Procesamiento | PostgreSQL durable futuro, lease 60 s/heartbeat 15 s, fence por versión y publicación staging→stored→ready | Decisión escrita, no sistema de tareas implementado |
| Límites | 20 archivos, 50 MB/archivo, 100 MB extraídos, 8.000 code points/fragmento y 500 fragmentos/doc; descarga 10 s conexión/30 s total, máximo 3 redirecciones; unidades decimales | Defaults de diseño, no benchmark |
| Presupuesto | USD 20/día UTC; reserva atómica previa, liquidación por uso, retención si desconocido; tarifa fechada obligatoria | Decisión escrita, fase 02 |
| Operación/evaluación | Perfil candidato 4 vCPU/8 GiB/100 GB SSD; HTTPS privado, backup conjunto, carga y rúbrica en [cierre](evidence/phase00-closure.md#operación-y-evaluación) | Diseño, no despliegue/medición |

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
- [x] Evidencia de los diez pendientes en [cierre técnico](evidence/phase00-closure.md) y registro de revisión.
- [x] Bloqueos de viabilidad cerrados: parser científico, filtros/ciclo y decisiones/mecanismos de visor; límites del subset explícitos. Cierre aprobado en el registro de revisión. Ampliaciones o cambios de mecanismo requieren nueva decisión/prueba.

## Ejecución de Task 1

El [cierre técnico estable](evidence/phase00-closure.md) incorpora el seguimiento de la rama `phase00-finish` y conserva los límites de evidencia. El [histórico del proveedor](evidence/provider-phase00.md) no se reescribe: el seguimiento posterior corrige su conclusión temporal de fallo del parser. No se repiten llamadas IA ni se exige infraestructura/entitlement de fases posteriores para acreditar viabilidad.

## Defaults locales propuestos para implementación (no medidos)

| Área | Decisión provisional | Límite/recuperación |
|---|---|---|
| Ingesta | 20 archivos/operación; 50 MB = 50,000,000 bytes/archivo; máximo total 100 MB = 100,000,000 bytes de UTF-8 extraído. No truncar | Rechazar comprimidos en fase 00; si se habilitan, máximo 100 MB = 100,000,000 bytes expandidos y 10,000 entradas. Límites futuros a validar con cargas reales |
| Descargas futuras | HTTP/HTTPS público, máximo 10 s de conexión y 30 s totales por recurso, 3 redirecciones; 50,000,000 bytes por respuesta y 100,000,000 bytes por operación, incluidos datos descomprimidos | Validar destino/DNS y cada salto antes de conectarse; abortar al superar límites, sin publicación parcial ni truncamiento. Sin recursos secundarios, crawler ni JS. Implementación y pruebas SSRF en fase 05 |
| Fragmentos | Máximo 8,000 Unicode code points, solape 400 code points, máximo 500 fragmentos/documento | Fallar y conservar versión vigente si excede; sin publicación parcial |
| Tareas | Tabla PostgreSQL futura como registro durable, lease 60 s con heartbeat cada 15 s; sin cola adicional | 3 intentos automáticos con backoff 1/5/15 min; reintento manual posterior. Fence por versionId impide publicar trabajo obsoleto |
| Original + DB | Versiones inmutables y estados `staging → stored → ready`; `ready` solo tras rename atómico y hash coincidente | Al reinicio reconciliar `stored`: staging existente se renombra; destino con hash esperado se promueve a `ready`; archivo ausente/mismatch falla nueva versión y retiene la ready anterior. Temporales huérfanos >24 h se eliminan. Borrado marca tombstone, elimina derivados/original y se reanuda idempotentemente |
| IA | USD 20/día UTC, según especificación | Reserva atómica concurrente antes de llamada; liquidar con uso real; ante uso desconocido retener reserva hasta conciliación; detener al agotar. Tarifas del modelo con fecha son requisito de configuración: sin tarifa no llamar ni estimar |
| Operación/backups | Acceso privado tras TLS; backup diario consistente de PostgreSQL + manifiesto/hash + originales inmutables; cifrado AES-256-GCM antes de salir del volumen | Retención propuesta: 7 diarios, 4 semanales, 12 mensuales. Clave de cifrado fuera del repo/en gestor de secretos; restore conjunto trimestral. RPO 24 h/RTO 4 h propuestos, no medidos |
| Carga | 1,000 docs/espacio; 30 sesiones concurrentes; muestra de texto de 1 MB = 1,000,000 bytes y archivo máximo 50 MB = 50,000,000 bytes | Objetivo p95 pregunta ≤30 s; indexación de 1 MB ≤60 s. Archivos 1–10 MB ≤2 min; >10–25 MB ≤5 min; >25–50 MB ≤10 min. Registrar bins 1/2/5/10/25/50 MB, CPU/RAM, conexión y proveedor. Son objetivos candidatos, no medidos; hardware/host/dominio siguen desconocidos |

Estos valores son defaults de diseño para revisar antes de producción, no resultados experimentales ni capacidades ya implementadas. Perfil candidato, acceso HTTPS privado, backup y protocolo de carga se concretan en [operación y evaluación](evidence/phase00-closure.md#operación-y-evaluación); host/DNS/certificados y medición real corresponden al despliegue de fase 08.

**No se construye aquí:** la aplicación completa, una integración vectorial alternativa, una cola adicional por anticipado ni bibliotecas elegidas sin prueba. **Siguiente:** [fase 01](01-cuentas-espacios-y-permisos.md).
