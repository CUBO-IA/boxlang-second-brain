# Second Brain — Especificación

Especificación acordada para el reto **07 — Second Brain**, del equipo **Out of the Box**.

Fecha de consolidación: **11 de octubre de 2026**.

Estos documentos describen el producto solicitado, no funcionalidades ya implementadas. El alcance funcional está definido; las propuestas y validaciones técnicas pendientes se identifican explícitamente. Guardar esta especificación no autoriza iniciar la implementación.

## Índice

1. [Objetivo y alcance](01-objetivo-y-alcance.md): problema, usuarios, caso principal, primera entrega y exclusiones.
2. [Usuarios y espacios](02-usuarios-y-espacios.md): cuentas, roles, incorporación de miembros y conversaciones compartidas.
3. [Ingesta y documentos](03-ingesta-y-documentos.md): fuentes, formatos, procesamiento, actualización, reemplazo y borrado.
4. [Consultas y evidencia](04-consultas-y-evidencia.md): chat, selección de fuentes, citas, inferencias y contradicciones.
5. [Grafo y previsualización](05-grafo-y-previsualizacion.md): relaciones, exploración y visores web.
6. [Arquitectura y seguridad](06-arquitectura-y-seguridad.md): tecnologías, almacenamiento, reutilización y controles obligatorios.
7. [Operación y límites](07-operacion-y-limites.md): despliegue, capacidad, rendimiento y presupuesto.
8. [Aceptación y pendientes](08-aceptacion-y-pendientes.md): suite reproducible, entrega y validaciones antes de implementar.

## Resumen de decisiones

| Aspecto | Decisión |
|---|---|
| Usuarios principales | Equipos de trabajo |
| Caso principal | Consulta de políticas contradictorias con evidencia |
| Primera entrega | Todas las funciones acordadas, sin simulaciones |
| Organización | Espacios compartidos; consultas separadas por espacio |
| Acceso | Correo y contraseña, sin verificación ni recuperación por email en el prototipo |
| IA | OpenAI directamente, a través de BoxLang AI |
| Embeddings | `text-embedding-3-small` |
| Respuestas | `gpt-6-luna` |
| Originales | Volumen persistente privado de Docker |
| Conocimiento | PostgreSQL con pgvector |
| Web | Next.js y TypeScript |
| Despliegue | Docker Compose en servidor privado con HTTPS |
| Idiomas | Interfaz y documentos ES/EN |
| Presupuesto | USD 20 diarios para operaciones de IA de la aplicación |

La base técnica existente se describe en el [README del proyecto](../../README.md). Los compromisos de entrega del evento están en el [checklist del hackathon](../../REQUISITOS-HACKATHON.md).
