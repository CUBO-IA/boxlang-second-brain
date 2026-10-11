# 03 — Ingesta y documentos

## Fuentes

| Fuente | Alcance |
|---|---|
| Archivos desde la web | Carga individual o múltiple |
| Notas en la aplicación | Creación, edición y pegado de texto |
| URL pública | Una página HTML, sin autenticación, sin recorrer enlaces ni ejecutar JavaScript |
| GitHub público | Repositorio y rama elegidos, con selección o delimitación de archivos |

Los repositorios deben excluir dependencias, archivos generados, binarios y archivos sensibles conocidos. Todo contenido importado se trata como datos, nunca como código ejecutable.

## Formatos

| Formato | Extensiones previstas | Información que debe conservarse |
|---|---|---|
| PDF con texto | `.pdf` | Texto y referencias a páginas y fragmentos |
| Markdown y texto | `.md`, `.txt` | Texto, estructura y ubicaciones |
| JSON | `.json` | Estructura y rutas de campos |
| Código fuente | Extensiones admitidas de texto | Contenido y números de línea |
| Word | `.docx` | Contenido estructurado y ubicaciones normalizadas |
| CSV | `.csv` | Filas, columnas y valores |
| Excel | `.xlsx` | Hojas, celdas y valores |

El código previsto para resaltado comprende BoxLang, CFML, JavaScript, TypeScript, Python, Java, SQL, YAML y TOML. Otros archivos compatibles de texto podrán mostrarse sin resaltado específico.

Los PDFs escaneados se identifican como no compatibles para consultas. No se presentarán como correctamente indexados. OCR e interpretación de imágenes quedan fuera del alcance.

## Procesamiento

La ingesta debe:

1. Comprobar autorización sobre el espacio y validar la entrada.
2. Conservar el original o el contenido importado y su procedencia.
3. Extraer contenido con las ubicaciones necesarias para citas.
4. Particionarlo en fragmentos preservando su relación con la fuente.
5. Generar embeddings e indexar los fragmentos dentro del espacio correcto.
6. Generar la información de relaciones necesaria para el grafo.
7. Indicar qué contenido está disponible y qué falló.

Se reutilizarán loaders y estrategias de BoxLang AI cuando cumplan el contrato. La estrategia concreta de particionado se elegirá después de validar formatos y ubicaciones; no se presupone que todos los loaders ya preserven esas coordenadas.

### Estados visibles

- Pendiente.
- Procesando.
- Disponible para consultas.
- Fallido o no compatible.

Un archivo guardado no equivale a un archivo indexado. Los fallos no deben producir confirmaciones falsas ni respuestas basadas en una ingesta incompleta presentada como exitosa. Debe existir una forma explícita de reintentar una operación fallida.

## Actualización manual

- Las URLs y los repositorios se actualizan por acción del usuario autorizado.
- Editar una nota o reemplazar un archivo provoca su reprocesamiento.
- No hay vigilancia continua, programación periódica ni webhooks.

## Reemplazo sin historial de versiones

- El contenido actualizado sustituye al anterior en nuevas consultas y relaciones.
- No hay historial navegable de versiones.
- Un reemplazo fallido no destruye la última información válida.
- El cambio de contenido debe mantener consistencia entre original, texto, vectores y relaciones.
- Las conversaciones previas se conservan, incluidos sus posibles extractos.
- Sus citas se marcan como **fuente reemplazada** y no se abren ni resaltan sobre el nuevo contenido como si fuera la evidencia antigua.

## Eliminación

Eliminar un documento retira:

- Su archivo original.
- Su contenido extraído.
- Sus fragmentos y vectores.
- Sus relaciones y los conceptos que queden sin otras fuentes de respaldo.

El documento deja de participar en nuevas búsquedas, respuestas y grafos.

Las conversaciones históricas se conservan y pueden contener extractos del documento. Sus citas se marcan como **fuente eliminada**. Esta conservación debe quedar explícita para el usuario: borrar el documento no implica purgar su contenido de todos los mensajes históricos.
