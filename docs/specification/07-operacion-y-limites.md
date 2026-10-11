# 07 — Operación y límites

## Despliegue

- Docker Compose en un servidor privado, accesible a un grupo limitado.
- HTTPS para acceso web.
- Persistencia de PostgreSQL y de los originales en volúmenes.
- Sin S3 ni instalación de runtimes o módulos globales en el equipo.
- Sin abrir registro a internet en esta entrega.

El hardware, el dominio, la terminación HTTPS y el procedimiento de respaldo y recuperación deben concretarse antes del despliegue. Un volumen persistente no sustituye una copia de seguridad.

## Capacidad objetivo

| Magnitud | Objetivo del prototipo |
|---|---:|
| Usuarios simultáneos | Hasta 30 |
| Documentos por espacio | Hasta 1.000 |
| Tamaño máximo por archivo | 50 MB |

Estos objetivos no equivalen a rendimiento ya demostrado. Los archivos importados desde repositorios forman parte de la colección del espacio; el repositorio no puede utilizarse para eludir sus límites.

Antes de implementar deben fijarse límites adicionales para cantidad de archivos importados, contenido expandido y número de fragmentos. También debe definirse qué sucede al alcanzar cada límite, evitando truncamientos silenciosos presentados como ingesta completa.

## Rendimiento objetivo

- El 95 % de preguntas estándar debe completarse en hasta 30 segundos.
- Un documento de texto de hasta 1 MB debe quedar indexado en hasta 60 segundos.
- Los archivos mayores, hasta 50 MB, necesitan objetivos separados todavía por definir.
- La ingesta debe mostrar estado o progreso y comunicar fallos.
- El grafo utiliza una vista inicial acotada con expansión progresiva.

Las mediciones deben especificar hardware, colección, carga concurrente, conexión y límites de OpenAI. No son garantías independientes de esas condiciones. Debe concretarse la carga bajo la cual se miden ambos objetivos temporales.

## Presupuesto de IA

Límite diario de la aplicación: **USD 20**.

Debe:

1. Registrar consumo y coste estimado.
2. Contabilizar embeddings, respuestas y cualquier otra operación de IA.
3. Considerar operaciones concurrentes al determinar el presupuesto disponible.
4. Detener nuevas operaciones de IA cuando se agote ese presupuesto.
5. Informar del agotamiento sin presentarlo como un fallo de los documentos.

El periodo diario y las tarifas utilizadas para estimar coste deben ser explícitos. El importe es un control de la aplicación: no garantiza el gasto total de una clave usada por otros sistemas ni reemplaza los controles de la cuenta del proveedor.

## Fallos y recuperación

- No declarar disponible un documento que no terminó de indexarse.
- Permitir reintentos explícitos sin duplicar conocimiento ni relaciones.
- Conservar la última información válida si un reemplazo falla.
- Evitar que una tarea antigua publique resultados de un documento ya eliminado o reemplazado.
- Mantener coherencia entre originales, registros, vectores y grafo.
- Separar errores de formato, permisos, presupuesto y disponibilidad del proveedor.

La elección técnica para ejecutar y recuperar tareas permanece pendiente; no se presupone la necesidad de un servicio de colas adicional.
