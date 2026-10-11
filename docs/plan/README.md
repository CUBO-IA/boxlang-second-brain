# Second Brain — Plan de implementación por fases

Fecha: **11 de octubre de 2026**. Fuente de alcance: [especificación](../specification/README.md).

Este plan organiza el trabajo por fases; cada una se autoriza por separado. Las fases intermedias son incrementos verificables, no una reducción de la primera entrega: esta debe cumplir toda la especificación, sin simulaciones.

## Punto de partida

Las fases 00 y 01 están verificadas en la carpeta original. La base incluye Docker Compose, PostgreSQL/pgvector, BoxLang AI, Next.js y `GET /api/health.bxm`; se probó viabilidad acotada de modelos, vectores, extracción y visores. La fase 01 entrega cuentas, sesiones, espacios, membresías y permisos efectivos con migración versionada. El [registro de revisión](evidence/phase00-review.md) distingue comprobaciones actuales, evidencia externa reutilizada y límites. No hay ingesta ni funcionalidades de biblioteca/chat; despliegue y rendimiento siguen en fases posteriores.

- **Backend:** BoxLang implementa autenticación, autorización, persistencia, ingesta, tareas, recuperación, respuestas, relaciones y presupuesto. El núcleo de conocimiento permanece reutilizable e independiente de HTTP y Next.js.
- **Frontend:** Next.js, TypeScript y App Router implementan pantallas, interacción, grafo y visores. Si se necesita una capa de transporte en Next.js, solo delega en BoxLang; no se convierte en un segundo backend de negocio.
- **IA y datos:** reutilizar `bx-ai` y su integración PostgreSQL/pgvector antes de crear componentes propios. Originales en un volumen privado persistente, no en rutas públicas ni como binarios en PostgreSQL.
- **Ejecución:** Docker Compose, sin instalar runtimes ni módulos globalmente. Versiones BoxLang en `box.json`; dependencias frontend en sus descriptores existentes.
- **Documentación técnica:** al implementar, consultar el MCP oficial de BoxLang; para Next.js, las guías de la versión instalada indicadas en `frontend/AGENTS.md`. No asumir APIs ni capacidades sin verificarlas.

## Secuencia y seguimiento

Las dependencias son acumulativas: cerrar una fase antes de avanzar a la siguiente. Un bloqueo técnico no autoriza cambiar modelos, omitir funciones ni agregar infraestructura sin aprobación.

| Fase | Resultado verificable | Estado |
|---|---|---|
| [00 — Viabilidad y decisiones](00-viabilidad-y-decisiones.md) | Modelos/vectores y subset de extracción/visores comprobados; decisiones/límites registrados y gate aprobado | Verificada |
| [01 — Cuentas, espacios y permisos](01-cuentas-espacios-y-permisos.md) | Registro/sesión, membresías y roles efectivos; protección del último administrador | Verificada |
| [02 — Biblioteca, tareas y presupuesto](02-biblioteca-tareas-y-presupuesto.md) | Originales privados persistentes, ciclo recuperable y reservas de consumo concurrentes | En curso — A+C integrados; B pendiente |
| [03 — Ingesta, chat y evidencia](03-ingesta-chat-y-evidencia.md) | TXT/notas → embeddings reales → chat multifuente → cita resaltada; historial y compartir en lectura | Pendiente |
| [04 — Formatos y previsualizadores](04-formatos-y-previsualizadores.md) | PDF, MD, JSON, código, DOCX, CSV y XLSX con consulta, coordenadas y visor funcional | Pendiente |
| [05 — URL y GitHub públicos](05-url-y-github-publicos.md) | Importación segura, selección de archivos, procedencia y actualización manual consistente | Pendiente |
| [06 — Contradicciones y evaluación](06-contradicciones-y-evaluacion.md) | Conflictos con evidencia de ambos lados y 20 casos concretos con puertas críticas | Pendiente |
| [07 — Grafo y relaciones](07-grafo-y-relaciones.md) | Documentos/conceptos, tres tipos de relación con respaldo, búsqueda y expansión autorizadas | Pendiente |
| [08 — Operación y recuperación](08-operacion-rendimiento-y-recuperacion.md) | HTTPS privado, respaldo restaurado, reinicios seguros y rendimiento medido | Pendiente |
| [09 — Aceptación y entrega](09-aceptacion-y-entrega.md) | Regresión completa, instalación limpia, demo verificable y entrega del hackathon | Pendiente |

Estados de seguimiento: **Pendiente / En curso / Bloqueada / Verificada**. Para marcar una fase como verificada, registrar revisión de código, comandos, entorno y resultados según [verificación](verificacion.md). No marcar tareas por haber creado archivos o pantallas solamente.

## Cómo usar los archivos de fase

Cada fase contiene:

1. **Qué se debe lograr:** un resultado observable, no una descripción genérica de funcionalidades.
2. **Trabajo ordenado:** tareas identificadas por fase y responsabilidad de BoxLang/Next.js.
3. **Flujos, operaciones o datos:** comportamiento necesario para conectar backend, persistencia e interfaz.
4. **Pruebas Pxx.n:** acción concreta y resultado esperado, incluidos errores y permisos.
5. **Entregables y finalización:** evidencia exigida para cerrar y límites de lo que no se implementa.

Ejemplo de seguimiento: `03.4` identifica recuperación; `P03.2` verifica que la selección de documentos no se amplíe indebidamente. Los IDs `V01–V20` de [verificación](verificacion.md#matriz-de-cobertura) conectan fases con requisitos de la especificación.

Al comenzar una fase, revisar sus decisiones/dependencias y autorizar el trabajo. Al cerrarla, adjuntar comandos reales, resultados y [registro de cierre](verificacion.md#registro-de-cierre) en su propio archivo. Mantener este índice sincronizado con ese estado; no duplicar aquí todas sus tareas.

## Decisiones pendientes, no implementaciones asumidas

La [fase 00](00-viabilidad-y-decisiones.md#decisiones-que-deben-quedar-escritas) concentra el registro de decisiones: modelo/API compatible, dimensiones, filtros vectoriales, loaders/ubicaciones, visores/grafo, tareas, límites, presupuesto y operación/evaluación.

Los requisitos funcionales de la especificación son obligatorios. Los nombres definitivos de tablas/endpoints, bibliotecas y estrategia de tareas se fijan mediante esas pruebas; este plan no los presenta como ya existentes ni introduce una arquitectura alternativa.

## Zonas del repositorio que se utilizarán

| Zona existente | Trabajo previsto |
|---|---|
| `ModuleConfig.bx` y código del módulo | Configuración y núcleo Pure BoxLang; ubicación mínima del código nuevo decidida en fase 00 |
| `backend/` | Entrada HTTP BoxLang, sesión y delegación al núcleo; no alojar originales en la ruta pública |
| `frontend/app/` | Pantallas Next.js e interacción; componentes compartidos solo cuando el uso real lo requiera |
| `box.json`, `Dockerfile`, `frontend/package.json` y lockfile | Dependencias verificadas y reproducibles, sin instalaciones globales |
| `compose.yaml`, `config/` y `docker/` | Datasource, volúmenes privados, ejecución y operación; migraciones de negocio reproducibles, no depender solo de inicialización de un volumen vacío |
| `tests/` | Comprobaciones BoxLang/HTTP y fixtures sintéticos; separar consumo real de IA |
| `docs/plan/` y `README.md` del proyecto | Seguimiento/evidencias y documentación de las capacidades efectivamente entregadas |

## Regla de cierre común

Cada fase deja el menor conjunto de pruebas ejecutables que detecte roturas de su lógica y amplía la regresión de fases anteriores. Los dobles de proveedor pueden comprobar errores, presupuesto y concurrencia sin coste; no sustituyen la validación real de embeddings, recuperación y respuestas.

No se incorporan OCR, sincronización continua, consultas entre espacios, servicios S3, otra base vectorial/de grafos ni funciones excluidas. Se agregan componentes solo cuando una prueba demuestre que lo existente no cubre un requisito acordado.
