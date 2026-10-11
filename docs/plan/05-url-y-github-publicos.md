# Fase 05 — URL y repositorios GitHub públicos

**Estado:** Pendiente. **Dependencia:** [fase 04](04-formatos-y-previsualizadores.md) verificada. [Índice](README.md).

**Fuente:** [fuentes e actualización](../specification/03-ingesta-y-documentos.md) y [seguridad](../specification/06-arquitectura-y-seguridad.md). **Cobertura:** V03–V08, V11–V12 y V16–V18.

## Qué se debe lograr

Importar una página pública o una selección de archivos de un repositorio GitHub público, consultarlos con evidencia y actualizarlos por acción explícita. Ninguna importación ejecuta código, rastrea enlaces ni accede a redes privadas.

## Flujo URL

1. Editor introduce URL HTTP/HTTPS pública; BoxLang valida destino y límites antes de descargar.
2. Se obtiene una única página HTML, sin login ni JavaScript, y se conserva contenido/procedencia.
3. Se extrae contenido normalizado con ubicaciones, se indexa y se muestra el resultado del procesamiento.
4. Usuario consulta, abre una cita y ve el fragmento almacenado; no se vuelve a descargar la web para simular la evidencia.
5. Editor actualiza manualmente: lo nuevo sustituye al contenido previo solo si termina correctamente; las citas históricas se marcan como reemplazadas.

## Flujo GitHub

1. Editor indica repositorio público y rama; revisa o delimita archivos a importar.
2. BoxLang identifica archivos admitidos/excluidos y aplica límites de cantidad, tamaño, expansión y colección.
3. Cada archivo importado se convierte en documento con repositorio, rama, ruta y referencia de la revisión importada como procedencia.
4. El resumen distingue disponibles, pendientes, fallidos y excluidos; un repositorio no se declara completamente ingerido si faltan archivos seleccionados.
5. Una actualización manual aplica cambios en la selección: añadidos, modificados y retirados se tratan conforme al ciclo documental, con política documentada si falla parte del lote.

## Backend BoxLang: tareas concretas

- [ ] **05.1 — Descarga segura.** Admitir únicamente esquemas y destinos previstos; rechazar credenciales en URL, destinos locales/privados y protocolos no permitidos. Verificar resolución y cada redirección, incluidos intentos de eludir validación mediante cambio de dirección.
- [ ] **05.2 — Límites de red.** Tiempo máximo, bytes descargados/expandidos y número de redirecciones según fase 00. No descargar recursos de la página ni recorrer sus enlaces para construir contenido.
- [ ] **05.3 — HTML.** Conservar procedencia y contenido importado, extraer texto/estructura normalizados, excluir contenido ejecutable y generar ubicaciones deterministas. La previsualización usa la representación almacenada saneada.
- [ ] **05.4 — GitHub público.** Validar repositorio/rama y delimitar archivos sin ejecutar herramientas del repositorio. Una referencia importada permite saber qué contenido se almacenó aunque la rama cambie después.
- [ ] **05.5 — Exclusiones.** Aplicar reglas verificables para dependencias, generados, binarios y sensibles conocidos. Documentar qué reglas se usan; no prometer detección perfecta de todo secreto posible.
- [ ] **05.6 — Cuotas.** Contar cada archivo aceptado dentro del límite de 1.000 documentos y los otros límites de fase 00. No usar un repositorio como único documento ficticio para eludir cuotas.
- [ ] **05.7 — Reintento/actualización.** Operaciones solo para editor/administrador, con tareas y presupuesto existentes. Evitar duplicación, preservar lo válido ante fallos y descartar resultados viejos. Definir cómo se identifican cambios y archivos retirados dentro de la selección importada.
- [ ] **05.8 — Resultado de lote.** Persistir correspondencia entre importación y documentos; comunicar aceptación/fallo/exclusión por archivo. La política de actualización parcial debe conservar consistencia y no simular una actualización completa.

## Frontend Next.js: pantallas y comportamiento

- [ ] Importar URL con validación informativa y explicación de «una página pública, sin ejecutar JavaScript».
- [ ] Importar GitHub con repositorio/rama y selección/delimitación; mostrar archivos excluidos y razones sin almacenar contenido sensible innecesario.
- [ ] Resumen de lote y estados por documento, reintento autorizado y botón explícito de actualización manual.
- [ ] Mostrar procedencia de página/repositorio en biblioteca, visor y citas. HTML normalizado y archivos GitHub reutilizan los visores existentes.
- [ ] Mensajes ES/EN para fuente privada/no accesible, límite, proveedor, descarga y formato; sin prompts ni URLs con credenciales en errores/logs.

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio |
|---|---|---|
| P05.1 | Importar página pública sintética y preguntar | Una sola página almacenada, cita normalizada navegable y sin rastreo |
| P05.2 | URL privada/local, redirección prohibida y resolución cambiante | Petición bloqueada sin acceder al destino prohibido |
| P05.3 | HTML con scripts, enlaces y recursos remotos | No ejecuta/recorre; previsualización saneada |
| P05.4 | GitHub público con dos ramas y archivos válidos/excluidos | Solo rama/selección correctas; exclusiones y procedencia verificables |
| P05.5 | Importar repo privado/ausente o exceder límites | Rechazo seguro y explícito, sin eludir cuota de documentos |
| P05.6 | Actualizar contenido y añadir/retirar archivos seleccionados | Derivados vigentes consistentes y citas históricas correctamente marcadas |
| P05.7 | Fallar actualización o reintentar parte del lote | Última información válida conservada; resumen exacto y sin duplicados |
| P05.8 | Repetir operaciones como lector/ajeno | No importan/actualizan; ajeno no lee fuente, tarea ni cita |

## Entregables y criterio de finalización

- [ ] Importadores integrados en el mismo pipeline y controles, reglas de exclusión y política de actualización documentadas.
- [ ] Fuente HTML sintética y repositorio público de prueba autorizado; escenarios de SSRF deterministas sin contactar redes ajenas.
- [ ] P05.1–P05.8 y filas remotas de la matriz de formatos aprobadas, con resultados de API y navegador.

**No se incluye:** repositorios privados/otros Git, crawler, sitios autenticados, ejecución de JS, webhooks o sincronización automática. **Siguiente:** [fase 06](06-contradicciones-y-evaluacion.md).
