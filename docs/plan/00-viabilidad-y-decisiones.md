# Fase 00 — Viabilidad y decisiones de implementación

**Estado:** Bloqueada (pendiente de verificación independiente). **Dependencia:** ninguna. [Índice](README.md).

**Fuente:** [arquitectura](../specification/06-arquitectura-y-seguridad.md) y [validaciones técnicas previas](../specification/08-aceptacion-y-pendientes.md#validaciones-técnicas-previas).

## Qué se debe lograr

Demostrar que la base instalada puede cumplir los contratos críticos antes de diseñar tablas, endpoints o pantallas definitivas. Al terminar, debe saberse qué se reutiliza, qué adaptación mínima hace falta y qué está bloqueado. No basta con encontrar una función en la documentación.

## Trabajo ordenado

- [ ] **00.1 — Línea base.** Levantar Compose y ejecutar `tests/smoke.bxs` y `tests/http.mjs` con los comandos de [verificación](verificacion.md#comandos-existentes). Registrar versiones efectivas, resultado y revisión del repositorio.
- [ ] **00.2 — Respuestas reales.** Desde BoxLang AI instalado, enviar una petición sintética a `gpt-6-luna`. Registrar endpoint/API compatible, configuración, respuesta y uso reportado. Si no funciona, identificar si falla acceso, API o módulo; no sustituir el modelo silenciosamente.
- [ ] **00.3 — Embeddings.** Generar un embedding con `text-embedding-3-small`, comprobar su longitud y probar inserción/recuperación en pgvector. Confirmar o bloquear las 1.536 dimensiones propuestas antes de crear el esquema de negocio.
- [ ] **00.4 — Aislamiento vectorial.** Crear datos sintéticos temporales de dos espacios con textos casi idénticos. Consultar uno y demostrar que el filtro se aplica en la recuperación, no después. Comprobar también selección de documentos.
- [ ] **00.5 — Ciclo vectorial.** Sustituir y eliminar los vectores de un documento sin afectar otro del mismo espacio; comprobar metadatos y ausencia de resultados viejos. Limpiar solo los datos creados por la prueba.
- [ ] **00.6 — Extracción.** Probar PDF con texto, MD, TXT, JSON, código, DOCX, CSV y XLSX; registrar loader usado, dependencia, contenido y ubicación. Una cadena de texto sin coordenadas no aprueba el formato.
- [ ] **00.7 — Navegación.** Probar que cada tipo de ubicación puede abrirse y resaltarse en un visor. Revisar dependencias actuales antes de seleccionar bibliotecas; documentar licencia y límites de las elegidas. Probar además la viabilidad del grafo acotado con expansión.
- [ ] **00.8 — Contratos mínimos.** Definir documentos, fragmentos, ubicaciones, citas, respuestas, conversaciones, tareas y relaciones; identificar tablas y operaciones necesarias. Mantener los contratos del núcleo independientes de Next.js y del transporte HTTP.
- [ ] **00.9 — Fallos y operación.** Elegir ejecución/recuperación de tareas y publicación consistente entre archivos y base. Fijar límites adicionales, presupuesto concurrente, servidor, HTTPS, respaldo y condiciones de carga.
- [ ] **00.10 — Evaluación.** Fijar rúbrica de los 20 casos, evidencias admisibles y condiciones de aprobación antes de ajustar prompts o recuperación.

Las pruebas de proveedor necesitan una clave autorizada y presupuesto de validación. La prueba pequeña de esta fase se registra por separado; no se pretende que el control presupuestario de aplicación de fase 02 ya exista.

## Decisiones que deben quedar escritas

Completar esta tabla con resultado real y enlace a la evidencia. «Por decidir» bloquea la parte del diseño que dependa de esa decisión.

| Decisión | Resultado que debe registrarse | Estado inicial |
|---|---|---|
| Modelo de respuestas | Acceso a `gpt-6-luna`, API compatible con `bx-ai`, configuración y límites de respuesta | Por validar |
| Embeddings | Acceso al modelo, dimensiones reales y compatibilidad del almacenamiento | Por validar |
| Recuperación | Cómo aplicar espacio/documentos antes de recuperar y cómo comprobarlo | Por validar |
| Vectores | Operaciones reales de inserción, sustitución y borrado con metadatos | Por validar |
| Extracción/particionado | Loader por formato, ubicaciones, tamaños de fragmento y límites estructurales | Por decidir tras pruebas |
| Visores/grafo | Bibliotecas mínimas, licencias, resaltado, teclado y límites de representación | Por decidir tras pruebas |
| Procesamiento | Dónde se ejecutan tareas, cómo se recuperan y cómo se impide publicar resultados obsoletos | Por decidir |
| Límites | Máximos de archivos/importación, contenido expandido, fragmentos, descargas y tiempo; unidades exactas de tamaño | Por decidir |
| Presupuesto | Periodo/zona horaria, tarifas y fecha, estimación previa, reservas concurrentes y conciliación de fallos | Por decidir |
| Operación/evaluación | Hardware, acceso privado, HTTPS, respaldo, carga de medición, objetivos de archivos grandes y rúbrica | Por decidir |

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

- [ ] Scripts pequeños reproducibles para las capacidades críticas, separados según consuman o no API externa.
- [ ] Tabla anterior completada, contratos y diseño mínimo de datos/operaciones documentados, sin secretos ni documentos privados.
- [ ] Evidencia de los diez pendientes técnicos de la especificación y [registro de cierre](verificacion.md#registro-de-cierre).
- [ ] Todos los bloqueos que afecten las fases siguientes resueltos; si necesitan cambiar una decisión acordada, obtener aprobación primero.

## Ejecución de Task 1

Resultados, comandos, versiones, decisiones propuestas y bloqueos: [informe Task 1](../../.superpowers/sdd/00-viabilidad-y-decisiones/task-1-report.md). El estado permanece Bloqueada hasta validación independiente de Sol; las interfaces, scripts y fixtures no equivalen a aprobación técnica.

## Defaults locales propuestos para implementación (no medidos)

| Área | Decisión provisional | Límite/recuperación |
|---|---|---|
| Ingesta | 20 archivos por operación; 50 MiB/archivo (límite acordado); 100 MiB de texto extraído total; rechazar, no truncar | ZIP/archivos comprimidos no admitidos en esta fase; si se habilitan, máximo 100 MiB expandidos y 10.000 entradas |
| Fragmentos | 8.000 caracteres máximo, 400 de solape, máximo 500 por documento | Fallar y conservar la versión vigente si excede; sin publicación parcial |
| Tareas | Tabla PostgreSQL futura como registro durable, lease 60 s con heartbeat cada 15 s; sin cola adicional | 3 intentos automáticos con backoff 1/5/15 min; reintento manual posterior. Fence por versionId impide publicar trabajo obsoleto |
| Original + DB | Versiones inmutables y estados `staging → stored → ready`; `ready` solo tras rename atómico y hash coincidente | Al reinicio reconciliar `stored`: staging existente se renombra; destino con hash esperado se promueve a `ready`; archivo ausente/mismatch falla nueva versión y retiene la ready anterior. Temporales huérfanos >24 h se eliminan. Borrado marca tombstone, elimina derivados/original y se reanuda idempotentemente |
| IA | USD 20/día UTC, según especificación | Reserva atómica concurrente antes de llamada; liquidar con uso real; ante uso desconocido retener reserva hasta conciliación; detener al agotar. Tarifas del modelo con fecha son requisito de configuración: sin tarifa no llamar ni estimar |
| Operación | Solo acceso privado tras proxy TLS/HTTPS; puertos de Compose no públicos | Backup diario coordinado de snapshot PostgreSQL + manifiesto/hash de originales inmutables. Defaults de recuperación RPO 24 h/RTO 4 h, sujetos a prueba de restore |
| Carga | Caso reproducible: 1.000 docs/espacio, 30 sesiones concurrentes, texto de 1 MiB y archivos de hasta 50 MiB; registrar tamaño y proveedor | Medir p95 de preguntas ≤30 s e indexado de texto 1 MiB ≤60 s. Hardware, dominio, conexión y topología siguen desconocidos; no afirmar que esos objetivos se cumplen |

Estos valores son defaults de diseño para revisar antes de producción, no resultados experimentales ni capacidades ya implementadas. El hostname/dominio, recursos del servidor y tarifas no se inventan en fase 00.

**No se construye aquí:** la aplicación completa, una integración vectorial alternativa, una cola adicional por anticipado ni bibliotecas elegidas sin prueba. **Siguiente:** [fase 01](01-cuentas-espacios-y-permisos.md).
