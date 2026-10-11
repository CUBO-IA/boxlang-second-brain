# Fase 04 — Formatos locales y previsualizadores

**Estado:** Pendiente. **Dependencia:** [fase 03](03-ingesta-chat-y-evidencia.md) verificada. [Índice](README.md).

**Fuente:** [formatos e ingesta](../specification/03-ingesta-y-documentos.md), [citas](../specification/04-consultas-y-evidencia.md#contrato-de-citas) y [visores](../specification/05-grafo-y-previsualizacion.md). **Cobertura:** V05–V08, V11, V15–V16.

## Qué se debe lograr

Todos los formatos locales acordados participan en consultas reales y tienen un visor que abre/resalta su evidencia. «Podemos extraer texto» no es suficiente si se pierden páginas, líneas, campos o celdas.

## Incrementos por formato

Implementar cada fila de extremo a extremo, usando los loaders/adaptaciones y bibliotecas validados en fase 00. No terminar primero todos los extractores dejando la verificación visual para el final.

| Incremento | Backend BoxLang | Frontend Next.js | Evidencia de aprobación |
|---|---|---|---|
| 04.1 PDF con texto | Extraer páginas/fragmentos y detectar ausencia de texto utilizable | Visor del original privado con página y resaltado | Cita de página no inicial; PDF escaneado explícitamente no compatible |
| 04.2 Markdown | Conservar texto/estructura y ubicación verificable en representación normalizada | Renderizado saneado y navegación al fragmento | Cita en encabezado/lista; HTML malicioso no ejecutado |
| 04.3 JSON | Conservar estructura y rutas inequívocas de campos/arrays | Árbol/estructura navegable, apertura de ruta y resaltado | Valor repetido en distintas rutas resalta solo el campo correcto |
| 04.4 Código | Texto con líneas estables y procedencia | Numeración y resaltador existente cuando sea compatible | Rango de líneas correcto, código jamás ejecutado |
| 04.5 DOCX | Extraer contenido estructurado y ubicaciones normalizadas | Vista convertida con secciones/fragmentos localizables | Cita coincide con párrafo/tabla normalizados, no con páginas inventadas |
| 04.6 CSV | Conservar filas, columnas y valores con parseo correcto | Tabla que permite ubicar y resaltar celdas/rangos | Comillas, separadores y saltos de línea dentro de campos no desplazan la cita |
| 04.7 XLSX | Conservar hoja/celdas y valores | Selección de hojas y tablas localizables | Cita abre hoja no inicial y celdas correctas; sin ejecutar macros |

Los TXT y notas de fase 03 se mantienen en la regresión. Para Markdown, el contrato debe conectar ubicación textual y fragmento renderizado de forma determinista; no basta con buscar la primera coincidencia de un texto repetido.

## Backend BoxLang: tareas comunes

- [ ] **04.8 — Validación real.** Detectar archivos corruptos, discrepancias tipo/extensión, formatos no admitidos y contenido comprimido abusivo. Aplicar límites al contenido expandido además del archivo original.
- [ ] **04.9 — Particionado estructural.** Respetar páginas, secciones, rutas y tablas donde afecten evidencia; conservar todas las ubicaciones necesarias si un fragmento cubre varias unidades.
- [ ] **04.10 — Derivados.** Persistir representación/ubicaciones suficientes para visor y cita; original autorizado y representación normalizada pertenecen a la misma revisión vigente.
- [ ] **04.11 — Fallos.** Si extracción/indexación queda incompleta, no anunciar éxito completo. Reemplazo fallido conserva contenido válido; reintento no duplica fragmentos y borrado limpia derivados.
- [ ] **04.12 — Código como datos.** Admitir los lenguajes definidos: BoxLang, CFML, JavaScript, TypeScript, Python, Java, SQL, YAML y TOML. Otros textos compatibles pueden verse sin resaltado específico; no ejecutar archivos ni instalar sus dependencias.

## Frontend Next.js: tareas comunes

- [ ] Reutilizar los visores elegidos; compartir el contrato de apertura por cita sin construir un resaltador propio.
- [ ] Autorizar originales/representaciones mediante BoxLang; una URL o caché de visor no debe permitir eludir permisos o mezclar revisiones/espacios.
- [ ] Saneamiento de Markdown y contenido convertido; enlaces y recursos remotos según política segura definida. No ejecutar scripts, macros o instrucciones embebidas.
- [ ] Carga y errores por formato, controles identificables, teclado cuando corresponda y ES/EN.
- [ ] Explicar que DOCX/XLSX son vistas estructuradas y no reproducciones visuales idénticas a Word/Excel.

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio |
|---|---|---|
| P04.1 | Cargar una muestra válida por cada formato y consultar | Embeddings/recuperación reales; respuesta y evidencia admisibles |
| P04.2 | Abrir todas las citas de las muestras | Página/línea/ruta/hoja/celda/fragmento correctos y resaltados |
| P04.3 | Usar fragmentos con texto repetido y límites de partición | Ninguna cita abre otra ocurrencia ni pierde coordenadas |
| P04.4 | Cargar PDF escaneado, archivos corruptos y expansión excesiva | Error/no compatible explícito; sin falsa disponibilidad |
| P04.5 | Cargar Markdown/HTML activo y código con instrucciones maliciosas | Sin ejecución ni fuga de datos; contenido tratado como fuente no confiable |
| P04.6 | Reemplazar/borrar/reintentar en cada formato | Nuevas consultas vigentes, históricos marcados, sin derivados residuales |
| P04.7 | Abrir original/visor/cita como lector, editor y ajeno | Lectura según rol; ajeno rechazado en backend, no solo en interfaz |

## Entregables y criterio de finalización

- [ ] Matriz por formato con loader, dependencias, representación, ubicación y visor efectivamente utilizados.
- [ ] Muestras sintéticas válidas/invalidas y scripts/documentación de navegador; licencias de dependencias registradas.
- [ ] P04.1–P04.7 y todas las filas locales de la [matriz de formatos](verificacion.md#formatos-fuentes-y-citas) aprobadas.

**No se incluye:** OCR, ingesta de imágenes como conocimiento ni fidelidad visual idéntica a Office. **Siguiente:** [fase 05](05-url-y-github-publicos.md).
