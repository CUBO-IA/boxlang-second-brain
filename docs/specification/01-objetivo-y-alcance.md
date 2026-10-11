# 01 — Objetivo y alcance

## Objetivo

Transformar información dispersa en conocimiento consultable por equipos, con respuestas verificables que conecten fuentes, identifiquen posibles contradicciones y distingan contenido respaldado de inferencias.

El sistema debe aceptar documentos, código, notas y datos estructurados, conservar su procedencia y permitir consultar su contenido desde una web en Next.js.

## Caso principal

Un equipo incorpora políticas o procedimientos que contienen instrucciones potencialmente incompatibles. Un usuario pregunta sobre una situación concreta y obtiene:

- Una respuesta basada en las fuentes relevantes del espacio.
- Evidencia navegable de cada afirmación documental sustancial.
- Las posibles contradicciones y los fragmentos de ambos lados.
- Una separación explícita entre contenido respaldado, inferencias e incertidumbres.

El sistema no elige automáticamente una política ganadora. Tampoco debe confundir diferencias de contexto con contradicciones.

## Relación con el reto 07

| Parte del reto | Respuesta del proyecto |
|---|---|
| Ingesta multiformato | Archivos, notas, páginas públicas y repositorios públicos |
| Preguntas respaldadas por evidencia | Recuperación de fuentes y citas verificables |
| Conectar información | Relaciones entre documentos y conceptos en un grafo 2D |
| Identificar contradicciones | Análisis de conflictos relevantes durante las consultas |
| Distinguir hechos e inferencias | Clasificación por afirmación |
| Ampliación «Go Further» | Relaciones entre conceptos; no sincronización continua |
| Aporte reutilizable | Núcleo Pure BoxLang de ingesta, recuperación y respuestas, independiente de Next.js |
| Uso real de BoxLang AI | Embeddings, recuperación y generación de respuestas |

## Primera entrega

Debe incluir todas las funciones acordadas, realmente operativas:

1. Cuentas y espacios compartidos con roles.
2. Ingesta desde las fuentes y formatos definidos.
3. Consultas multifuente y conversaciones con seguimiento.
4. Citas con navegación y resaltado.
5. Clasificación de afirmaciones y detección de posibles contradicciones.
6. Grafo 2D de documentos y conceptos.
7. Previsualización de los documentos almacenados.
8. Interfaz ES/EN y consultas sobre documentos ES/EN, incluyendo recuperación entre idiomas.
9. Controles de acceso, presupuesto y validación reproducible.

No hay fecha de entrega definida. Los objetivos de capacidad y rendimiento necesitan validación en el entorno elegido.

## Fuera de esta entrega

- OCR de PDFs escaneados e ingesta de imágenes como conocimiento.
- Repositorios privados o servidores Git distintos de GitHub.
- Rastreo de sitios, páginas autenticadas y ejecución de JavaScript para importarlas.
- Carpetas sincronizadas, actualizaciones programadas y webhooks.
- Consultas que mezclen varios espacios.
- Resolución automática de políticas contradictorias.
- Historial navegable de versiones o papelera recuperable.
- Edición manual de relaciones y contradicciones como conexiones del grafo.
- Consultas iniciadas desde una selección de nodos del grafo.
- Colaboración de varios autores dentro de un chat compartido.
- Fidelidad visual idéntica a Word o Excel.
- S3, otra base vectorial o una base de grafos adicional.
- Verificación y recuperación por correo, registro público en internet y endurecimiento para producción.

Estas exclusiones delimitan el prototipo; no constituyen compromisos de una segunda fase.
