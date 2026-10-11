# Fase 09 — Aceptación integral y entrega

**Estado:** Pendiente. **Dependencia:** [fase 08](08-operacion-rendimiento-y-recuperacion.md) verificada. [Índice](README.md).

**Fuente:** [primera entrega](../specification/01-objetivo-y-alcance.md#primera-entrega), [aceptación](../specification/08-aceptacion-y-pendientes.md) y [hackathon](../../REQUISITOS-HACKATHON.md). **Cobertura:** V01–V20.

## Qué se debe lograr

Otra persona puede instalar, verificar y demostrar la primera entrega completa desde la documentación. El resultado entregado coincide con la revisión probada, usa BoxLang AI realmente y declara con claridad trabajo previo, límites y resultados.

## Trabajo ordenado

- [ ] **09.1 — Fijar versión candidata.** Identificar revisión y cambios locales evaluados; fijar versiones, migraciones y configuración de modelos. No publicar resultados de una revisión distinta como aceptación.
- [ ] **09.2 — Regresión sin IA.** Ejecutar infraestructura, HTTP, cuentas, roles, aislamiento, ciclo documental, seguridad de importaciones, presupuesto concurrente y recuperación según comandos reales documentados.
- [ ] **09.3 — Regresión con IA.** Ejecutar las 20 preguntas de fase 06 y recorridos reales por todos los formatos/fuentes. Guardar configuración, citas, consumo/coste y resultado por caso; no sustituir evaluaciones por respuestas guardadas.
- [ ] **09.4 — Verificación visual.** Abrir citas por tipo de ubicación, conflictos de ambos lados, fuentes históricas y grafo; comprobar ES/EN y permisos con usuarios reales de prueba.
- [ ] **09.5 — Instalación limpia.** Seguir exclusivamente la documentación en un entorno sin datos de aplicación; construir Compose, aplicar migraciones, cargar fixtures y ejecutar pruebas. No depender de runtimes globales ni pasos ocultos.
- [ ] **09.6 — Reutilización.** Ejecutar el núcleo Pure BoxLang sin Next.js y explicar su contrato, configuración y ejemplo de uso. Documentar qué hace `bx-ai` y qué adaptaciones pertenecen al proyecto.
- [ ] **09.7 — Documentación de entrega.** Actualizar README: instalación, variables, modelos, dependencias/licencias, comandos, fuentes/formatos, roles, datos externos, límites, respaldo, reintentos y significado de reemplazo/borrado.
- [ ] **09.8 — Hackathon.** Separar componentes previos del trabajo realizado en el periodo, identificar reto 07/equipo e integrantes, completar Devpost y revisar permisos/enlaces del repositorio para el jurado.

## Guion de demostración obligatorio

| Paso | Acción en vivo | Qué debe demostrar |
|---|---|---|
| 1 | Entrar, crear/seleccionar espacio y mostrar roles | Cuentas reales y organización aislada |
| 2 | Incorporar políticas de varios formatos y una fuente remota | Ingesta real, procedencia y estados; no demo solo PDF |
| 3 | Consultar una política con información repartida entre fuentes | Respuesta multifuente y etiquetas por afirmación |
| 4 | Preguntar por políticas potencialmente incompatibles | Dos lados, contexto y ausencia de ganador automático |
| 5 | Abrir citas de ambos lados | Ubicación real y resaltado verificable |
| 6 | Hacer pregunta sin evidencia y una consulta ES↔EN | Abstención y recuperación entre idiomas |
| 7 | Compartir conversación y abrirla como otro miembro | Solo lectura; solo autor continúa |
| 8 | Explorar/buscar/expandir grafo y abrir documento | Documentos/conceptos, tipos de relación y vista parcial explícita |
| 9 | Actualizar/reemplazar y eliminar una fuente | Nuevas búsquedas sin contenido viejo; citas históricas marcadas |
| 10 | Mostrar un fallo/reintento y agotamiento controlado de presupuesto | Errores honestos, recuperación y control de coste |

Para demostrar presupuesto sin gastar el límite, usar una configuración de prueba explícitamente identificada o un escenario determinista separado; no confundirlo con una respuesta real del modelo. Todos los documentos de la demo serán sintéticos o autorizados.

## Pruebas y puertas de cierre

- [ ] **P09.1:** V01–V20 y toda la matriz de formatos/fuentes aprobadas en la revisión candidata.
- [ ] **P09.2:** Suite real con al menos 18/20 aprobados, cero fallos críticos de abstención, cero falsos conflictos de contexto y todas las citas verificables.
- [ ] **P09.3:** Todas las pruebas de aislamiento/permisos aprobadas; ninguna puntuación de conocimiento compensa una fuga.
- [ ] **P09.4:** Instalación limpia y restauración comprobadas con comandos/documentación entregados.
- [ ] **P09.5:** Guion completo ejecutado, ES/EN y visores revisados; modelos/acceso/configuración disponibles para la demo.
- [ ] **P09.6:** Informes de capacidad/rendimiento, licencias, uso de IA y checklist del hackathon completos y consistentes con lo entregado.

## Paquete de entrega

- [ ] Repositorio accesible con núcleo BoxLang, backend, frontend Next.js, Compose y dependencias fijadas.
- [ ] Configuración de ejemplo sin credenciales; migraciones, fixtures y pruebas ejecutables con comandos reales.
- [ ] Informe de aceptación, informe de rendimiento y evidencia de restauración, sin contenido privado.
- [ ] Guion/datos de demostración, capturas, créditos y declaración de componentes previos/trabajo del evento.
- [ ] Registro final de cierre con responsables, revisión probada y resultados.

**Cierre del proyecto:** todas las funciones de la primera entrega operativas. Las fases parciales no autorizan excluir funciones, dejar simulaciones ni prometer como implementado lo que no fue verificado.
