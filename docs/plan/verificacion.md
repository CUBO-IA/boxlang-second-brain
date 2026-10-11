# Verificación y trazabilidad

Complemento del [plan por fases](README.md). Las listas son **pendientes de implementación y ejecución**, no resultados ya obtenidos.

## Cómo verificar una fase

1. Usar datos sintéticos o expresamente autorizados; mantener secretos y documentos privados fuera del repositorio y de los resultados.
2. Ejecutar las comprobaciones dentro de Docker Compose. Separar pruebas deterministas sin IA de pruebas que consumen OpenAI; no lanzar estas últimas sin autorización y presupuesto.
3. Probar las operaciones por API/núcleo además de la interfaz. Ocultar un botón no demuestra autorización.
4. Repetir las pruebas de aislamiento, ciclo documental y presupuesto al incorporar nuevos derivados o fuentes.
5. Registrar evidencia, corregir fallos y repetir. Una fase bloqueada o una prueba no ejecutada no cuenta como aprobada.

### Comandos existentes

Desde la raíz del proyecto, con `.env` configurado y sin exponer sus valores:

```bash
docker compose up -d --build --wait
docker compose exec boxlang boxlang tests/smoke.bxs
docker compose exec -T frontend node --input-type=module < tests/http.mjs
```

Estos comandos verifican únicamente la base actual. No prueban cuentas, ingesta, respuestas ni grafo.

Los futuros scripts deben documentar su comando real al crearse y ejecutarse en los contenedores existentes. Aprovechar scripts BoxLang y `node:assert` cuando basten; no agregar un framework de pruebas por anticipado. Las comprobaciones visuales deben incluir navegador, acciones y resultado esperado; no confundir HTTP 200 con navegación/resaltado correctos.

### Registro de cierre

Añadir este registro al archivo de la fase cuando se verifique y actualizar su estado en el [índice](README.md); referenciar resultados reproducibles sin copiar contenido privado:

```text
Fase y estado:
Fecha / responsable:
Revisión de código y cambios locales evaluados:
Entorno y versiones:
Datos sintéticos utilizados:
Comandos y comprobaciones de navegador:
Resultados: aprobados / fallidos / no ejecutados:
Modelo, configuración, consumo y coste (si aplica):
Evidencias o informe:
Bloqueos pendientes:
```

## Matriz de cobertura

La fase indicada introduce la comprobación; fase 09 vuelve a ejecutar todas. Las pruebas de seguridad se amplían desde el momento en que existe cada recurso, no se posponen al despliegue.

Las pruebas `P00.n–P09.n` están descritas en sus archivos de fase. Cada futura prueba ejecutable o comprobación de navegador debe identificar qué `Pxx.n` cubre y qué requisitos `Vxx` verifica. Una acción por API y su comprobación visual pueden compartir el ID si verifican el mismo resultado.

| ID | Requisito y comprobación observable | Fases | Especificación |
|---|---|---|---|
| V01 | Registro/login/logout, contraseña protegida, sesión invalidada, límites de abuso y protección contra enumeración; sin email ni identidad verificada implícita | 01 | [Usuarios](../specification/02-usuarios-y-espacios.md), [seguridad](../specification/06-arquitectura-y-seguridad.md) |
| V02 | Usuario con varios espacios, roles por acción, incorporación genérica exista o no la cuenta, sin invitación pendiente ni espacio sin administrador | 01 | [Usuarios](../specification/02-usuarios-y-espacios.md) |
| V03 | Aislamiento de originales, texto, fragmentos, vectores, conceptos, relaciones, tareas, chat y citas; retirar membresía revoca acceso, incluso con IDs conocidos | 01–07 | [Usuarios](../specification/02-usuarios-y-espacios.md), [seguridad](../specification/06-arquitectura-y-seguridad.md) |
| V04 | Restricción de espacio y selección autorizada aplicadas antes de recuperación; contenido ajeno no llega al contexto del proveedor | 00, 03 | [Seguridad](../specification/06-arquitectura-y-seguridad.md) |
| V05 | Carga individual/múltiple y notas; formatos admitidos y procedencia conservados; archivo guardado no se presenta como indexado | 02–04 | [Ingesta](../specification/03-ingesta-y-documentos.md) |
| V06 | Estados, reintento idempotente, reinicio y errores diferenciados; sin vectores ni relaciones duplicados | 02–08 | [Ingesta](../specification/03-ingesta-y-documentos.md), [operación](../specification/07-operacion-y-limites.md) |
| V07 | Reemplazo fallido conserva lo válido; reemplazo correcto retira derivados previos; tarea obsoleta no publica; cita antigua no abre el contenido nuevo | 02–07 | [Ingesta](../specification/03-ingesta-y-documentos.md) |
| V08 | Borrado retira original, texto, vectores y relaciones/conceptos huérfanos; conversaciones conservadas con extractos y citas «fuente eliminada» | 02–07 | [Ingesta](../specification/03-ingesta-y-documentos.md) |
| V09 | Chat con seguimiento multifuente y selección de documentos; privado por defecto; compartido solo en lectura, solo autor continúa; administrador no lee privados ajenos | 03 | [Usuarios](../specification/02-usuarios-y-espacios.md), [consultas](../specification/04-consultas-y-evidencia.md) |
| V10 | Cada afirmación sustancial tiene etiqueta; respaldo verificable, inferencia con premisas, incertidumbre/abstención explícitas; historial no sustituye evidencia vigente | 03, 06 | [Consultas](../specification/04-consultas-y-evidencia.md) |
| V11 | Cada cita corresponde a fuente/fragmento autorizados y ubicación almacenada; abre y resalta evidencia real por formato; estados históricos correctos | 03–05 | [Consultas](../specification/04-consultas-y-evidencia.md), [visores](../specification/05-grafo-y-previsualizacion.md) |
| V12 | URL pública única sin rastreo/JS y GitHub público con rama/archivos; exclusiones y límites; actualización manual consistente | 05 | [Ingesta](../specification/03-ingesta-y-documentos.md) |
| V13 | Conflictos con ambos lados y contexto; diferencias de contexto no son conflictos; sin ganador automático ni pretensión de auditoría exhaustiva | 06 | [Consultas](../specification/04-consultas-y-evidencia.md) |
| V14 | Grafo con documentos/conceptos, tres tipos de conexión y procedencia; búsqueda fuera de vista inicial, expansión y apertura de documentos | 07 | [Grafo](../specification/05-grafo-y-previsualizacion.md) |
| V15 | UI ES/EN completa, documentos y preguntas ES/EN con recuperación cruzada; teclado y distinciones no dependientes del color | 01–08 | [Alcance](../specification/01-objetivo-y-alcance.md), [visores](../specification/05-grafo-y-previsualizacion.md) |
| V16 | Archivos/rutas abusivos, SSRF/redirecciones, HTML/Markdown activo y prompt injection; sin ejecución de código/macros, filtración de secretos ni logs privados innecesarios | 02–08 | [Seguridad](../specification/06-arquitectura-y-seguridad.md) |
| V17 | Límite USD 20 diario con concurrencia, reserva/conciliación y periodo/tarifas explícitos; cuenta toda IA, bloquea nuevas operaciones e informa correctamente | 02–08 | [Operación](../specification/07-operacion-y-limites.md) |
| V18 | Hasta 30 usuarios/1.000 documentos/50 MB; límites adicionales sin truncamiento silencioso; latencias medidas bajo condiciones declaradas | 02, 05, 08 | [Operación](../specification/07-operacion-y-limites.md) |
| V19 | HTTPS privado, persistencia tras reinicio, respaldo restaurado con base y archivos consistentes; configuración sin secretos | 08 | [Seguridad](../specification/06-arquitectura-y-seguridad.md), [operación](../specification/07-operacion-y-limites.md) |
| V20 | Núcleo invocable sin Next.js, uso real de BoxLang AI, instalación limpia, resultados y demo multiformato; créditos y componentes previos declarados | 03, 09 | [Aceptación](../specification/08-aceptacion-y-pendientes.md), [hackathon](../../REQUISITOS-HACKATHON.md) |

## Formatos, fuentes y citas

Para cada fila: comprobar ingesta real, consulta con evidencia, apertura/resaltado, acceso denegado, reemplazo, borrado y comportamiento histórico. Incluir entradas válidas e inválidas, no solo un archivo feliz.

| Formato/fuente | Ubicación verificable | Previsualización y caso relevante | Fase |
|---|---|---|---|
| TXT | Líneas/rangos | Texto con líneas; fragmento en un límite de partición | 03 |
| Nota | Sección/fragmento normalizado | Crear, editar, pegar y abrir evidencia | 03 |
| PDF con texto | Página/fragmento | Original privado y resaltado en página correcta; PDF escaneado no compatible | 04 |
| Markdown | Ubicación del texto normalizado | Renderizado saneado y fragmento localizable, sin ejecutar HTML peligroso | 04 |
| Código | Líneas/rangos | Lenguajes acordados, numeración y resaltado existente; no ejecutar | 04 |
| JSON | Ruta de campo | Estructura navegable y campo exacto, incluidos valores repetidos | 04 |
| DOCX | Sección/fragmento normalizado | Vista estructurada consistente con extracción, sin promesa de diseño idéntico | 04 |
| CSV | Filas/columnas | Tabla y celdas/rango correctos, con delimitadores y campos escapados | 04 |
| XLSX | Hoja/celdas | Selección de hojas y rango correcto, sin ejecutar macros | 04 |
| HTML de URL | Sección/fragmento normalizado | Contenido importado saneado; procedencia, redirecciones y actualización | 05 |
| GitHub público | Ruta de archivo y ubicación según formato | Rama seleccionada, delimitación/exclusiones y actualización de archivos | 05 |

## Suite de conocimiento: 20 casos

Preparar fuentes sintéticas ES/EN y fijar los resultados antes de ejecutar la evaluación. Incluir todos los formatos/fuentes mediante esta suite y la matriz funcional; no exigir que cada caso use todos los formatos.

Las fuentes, preguntas y resultados concretos propuestos para R01–R10, C01–C04, D01–D02 y A01–A04 están en la [fase 06](06-contradicciones-y-evaluacion.md#colección-sintética-y-casos-concretos). Esta sección conserva las cantidades y umbrales comunes, sin duplicar las preguntas.

| IDs | Cantidad | Criterio principal |
|---|---:|---|
| R01–R10 | 10 | Respuestas documentales correctas con fuentes/evidencias admisibles, selección y etiquetas; incluir multifuente, seguimiento, inferencia con premisas y recuperación ES↔EN |
| C01–C04 | 4 | Posibles contradicciones identificadas con ambos lados, contexto y sin resolución automática |
| D01–D02 | 2 | Diferencias de contexto no presentadas como contradicciones |
| A01–A04 | 4 | Abstención por falta de evidencia, sin completar con conocimiento externo presentado como documental |

Cada caso registra pregunta, idioma, espacio, fuentes vigentes, selección de documentos si aplica, configuración, resultado esperado, evidencias admisibles, etiquetas y criterios de aprobación. Evaluar significado y respaldo, no coincidencia literal del texto. No usar otro modelo como único árbitro de citas o permisos.

**Puertas de aceptación obligatorias:**

- Al menos **18/20** casos cumplen íntegramente su rúbrica.
- **Cero** fallos críticos de abstención en A01–A04.
- **Cero** falsos conflictos en D01–D02.
- **Todas** las citas emitidas son verificables, aunque un caso ya haya fallado por otra causa.
- **Todas** las pruebas de aislamiento y permisos aprueban.

No reemplazar estos umbrales por una media ni retirar un caso fallido de la colección. Registrar fallos y repetir con la configuración identificada; el resultado acredita esa colección, no precisión universal.

## Medición y recuperación

- Definir hardware, versiones, tamaño/composición de colección, concurrencia, conexión, límites del proveedor y qué constituye una pregunta estándar antes de medir.
- Medir el recorrido completo de la pregunta, no solo el primer token: objetivo p95 ≤30 s. Ingesta de texto hasta 1 MB: desde aceptación hasta disponibilidad, objetivo ≤60 s bajo la carga definida.
- Medir archivos mayores hasta 50 MB con los objetivos específicos definidos en fase 00; registrar errores, esperas y coste, no solo solicitudes exitosas.
- Probar saturación y agotamiento de presupuesto con concurrencia; los límites de documentos incluyen archivos procedentes de repositorios.
- Restaurar una copia de base y originales y validar permisos, búsqueda, citas y grafo. Reiniciar durante una tarea y comprobar recuperación, ausencia de duplicados y no publicación de resultados obsoletos.

## Checklist final

- [ ] Fases 00–08 verificadas con evidencias y bloqueos resueltos.
- [ ] V01–V20 y todas las filas de formatos/fuentes aprobadas en la revisión entregada.
- [ ] Suite de 20 casos y puertas críticas aprobadas después de la integración completa.
- [ ] Objetivos de capacidad/rendimiento medidos y condiciones publicadas; desviaciones sin ocultar.
- [ ] Instalación y restauración reproducibles, HTTPS y acceso limitado comprobados.
- [ ] Demo sin simulaciones, modelos reales, información sintética y todas las funciones acordadas.
- [ ] Documentación, licencias y [checklist del hackathon](../../REQUISITOS-HACKATHON.md) completos.
