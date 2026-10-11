# 05 — Grafo y previsualización

## Grafo 2D

El grafo permite explorar relaciones dentro del espacio activo, sin mezclar información de otros espacios.

### Nodos

- Documentos.
- Conceptos extraídos de las fuentes.

Ambos tipos deben distinguirse visualmente. Los conceptos deben conservar su vínculo con los documentos que los respaldan.

### Conexiones

| Tipo | Interpretación |
|---|---|
| Similitud de contenido | Proximidad semántica calculada a partir de embeddings |
| Conceptos compartidos | Documentos conectados mediante conceptos identificados en sus contenidos |
| Referencias explícitas | Enlaces o menciones detectados entre documentos existentes en el espacio |

La similitud calculada no se presenta como una relación demostrada. Debe distinguirse de una referencia explícita o una relación inferida. La información de origen y respaldo de las conexiones debe conservarse aunque no haya un inspector dedicado en esta entrega.

### Interacción

- Zoom y desplazamiento.
- Búsqueda y filtros.
- Selección de un documento para abrir su información y previsualización.
- Vista inicial acotada y expansión progresiva.

La búsqueda y los filtros trabajan sobre la colección autorizada, no solamente sobre los nodos dibujados. La interfaz indica cuándo muestra un subconjunto, sin sugerir que representa toda la colección.

No incluye edición manual de nodos o conexiones, posiciones persistidas, consultas desde una selección del grafo ni contradicciones como conexiones.

## Previsualización web

| Formato | Vista requerida |
|---|---|
| PDF | Visor del documento original |
| Markdown | Contenido renderizado |
| TXT y código | Texto con líneas y resaltado cuando corresponda |
| JSON | Estructura navegable |
| DOCX | Contenido convertido y estructurado |
| CSV | Tabla de filas y columnas |
| XLSX | Tablas y selección de hojas |
| Notas y páginas importadas | Contenido normalizado |

No se promete reproducir exactamente el diseño original de Word o Excel.

Se utilizarán visores existentes cuando cubran la necesidad; no se construirá un resaltador de código propio. La selección de bibliotecas queda pendiente de revisar las dependencias disponibles y de probar navegación, resaltado y rendimiento.

## Navegación desde evidencia

- Seleccionar una cita abre el documento en la ubicación correspondiente.
- Se resalta el fragmento, campo, celda o rango que respalda la afirmación.
- Para Word y HTML se utilizan ubicaciones del contenido normalizado.
- Una cita histórica de una fuente reemplazada o eliminada no se presenta como evidencia vigente.

Todo acceso al original y a la previsualización comprueba permisos. Los archivos no son públicos por el hecho de estar almacenados.

## Idiomas y accesibilidad

La interfaz estará disponible en español e inglés. La exploración y los visores deben mantener accesibilidad básica: controles identificables, uso por teclado cuando corresponda y distinciones que no dependan exclusivamente del color.
