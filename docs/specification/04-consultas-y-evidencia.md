# 04 — Consultas y evidencia

## Interacción

- Chat con historial y preguntas de seguimiento.
- Conversaciones privadas por defecto y compartibles en modo lectura, conforme a los [permisos de conversaciones](02-usuarios-y-espacios.md#conversaciones-privadas-y-compartidas).
- Consulta de todo el espacio activo o de documentos seleccionados.
- Recuperación de información relevante de varias fuentes autorizadas.
- Documentos ES/EN y recuperación entre idiomas.

El historial sirve de contexto conversacional, pero no sustituye la evidencia documental vigente ni permite reutilizar contenido de otro espacio o de fuentes ya inaccesibles.

## Clasificación por afirmación

Cada afirmación sustancial debe clasificarse como:

| Etiqueta | Significado |
|---|---|
| Respaldada | Está explícitamente sustentada por una fuente citada |
| Inferida | Es una conclusión derivada de premisas citadas |
| Incierta | La evidencia es insuficiente o ambigua |

Un hecho respaldado significa que la fuente lo sostiene, no que sea una verdad universal. Las inferencias deben mostrar sus premisas y no presentarse como citas literales o hechos documentales.

## Sin evidencia suficiente

El sistema se abstiene y explica qué información falta. Puede mostrar lo encontrado, indicando sus límites.

No completa la respuesta con conocimiento externo presentado como documental. No hay búsqueda autónoma en internet para suplir la colección durante las consultas.

## Contrato de citas

Cada afirmación documental sustancial debe tener evidencia verificable. Una cita contiene:

- Identificación del documento y su procedencia.
- Fragmento de apoyo.
- Ubicación verificable.
- Relación con la afirmación respaldada.
- Estado de la fuente cuando se consulta una conversación histórica.

| Fuente | Ubicación |
|---|---|
| PDF | Página y fragmento |
| Texto y código | Líneas o rango |
| JSON | Ruta del campo |
| CSV | Filas y columnas |
| XLSX | Hoja y celdas |
| DOCX, notas y HTML | Sección o fragmento del contenido normalizado |

Seleccionar una cita abre el visor en su ubicación y resalta la evidencia. Las coordenadas deben proceder de la extracción y del almacenamiento: no pueden ser ubicaciones inventadas por el modelo.

Las citas deben comprobarse contra las fuentes recuperadas y autorizadas. El tratamiento de fuentes reemplazadas o eliminadas se define en [ingesta y documentos](03-ingesta-y-documentos.md).

## Posibles contradicciones

La detección ocurre durante las consultas, entre fuentes relevantes recuperadas. No representa una revisión exhaustiva permanente de toda la colección ni permite afirmar que no existe ningún conflicto fuera de las fuentes analizadas.

Cada posible contradicción muestra:

1. Las afirmaciones potencialmente incompatibles.
2. Las fuentes y evidencias de ambos lados.
3. El contexto relevante: alcance, fechas, condiciones y población afectada.
4. Una explicación de por qué podrían entrar en conflicto.

Una diferencia de contexto no debe convertirse automáticamente en contradicción. El sistema no selecciona una política ganadora ni resuelve el conflicto por fecha de carga, similitud o preferencia del modelo.

No hay revisión humana registrada de conflictos ni contradicciones como conexiones del grafo en esta entrega.
