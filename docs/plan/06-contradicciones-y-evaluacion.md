# Fase 06 — Contradicciones y evaluación de conocimiento

**Estado:** Pendiente. **Dependencia:** [fase 05](05-url-y-github-publicos.md) verificada. [Índice](README.md).

**Fuente:** [clasificación y contradicciones](../specification/04-consultas-y-evidencia.md) y [aceptación](../specification/08-aceptacion-y-pendientes.md). **Cobertura:** V10–V11, V13 y V15.

## Qué se debe lograr

Responder sobre políticas potencialmente incompatibles sin ocultar un lado de la evidencia, confundir contextos o elegir automáticamente una política. Aprobar la suite de 20 casos definida antes de ajustar el sistema.

## Backend BoxLang: tareas concretas

- [ ] **06.1 — Análisis contextual.** Examinar las fuentes relevantes recuperadas durante la consulta y distinguir alcance, fechas, condiciones y población. Si un dato contextual no consta, indicar incertidumbre, no inventarlo.
- [ ] **06.2 — Contrato de conflicto.** Para cada posible contradicción: afirmaciones de ambos lados, evidencias admisibles, contexto y explicación. Validar todas las citas con las mismas reglas del chat.
- [ ] **06.3 — No resolver.** No usar fecha de carga, similitud o preferencia del modelo para seleccionar ganador; si una fuente habla de otro contexto, no presentarla automáticamente como incompatible.
- [ ] **06.4 — Alcance honesto.** Ausencia de conflicto en fuentes recuperadas no significa que toda la colección esté libre de contradicciones. No crear una auditoría permanente ni un flujo de revisión humana fuera del alcance.
- [ ] **06.5 — Evaluador reproducible.** Ejecutar casos fijados con sus fuentes/selección, guardar configuración, resultado, citas, uso y decisión de aprobación. Automatizar comprobaciones estructurales y revisar significado/respaldo con la rúbrica; otro modelo no será árbitro único.

## Frontend Next.js

- [ ] Mostrar ambas afirmaciones y sus citas junto con contexto y explicación, sin ranking de «política ganadora».
- [ ] Distinguir respaldado/inferido/incierto y posible conflicto mediante texto/iconografía además de color.
- [ ] Navegar a cada lado de la evidencia y conservar estados históricos de fuente.
- [ ] Informar de análisis limitado a las fuentes recuperadas; abstención y datos contextuales faltantes visibles en ES/EN.

## Colección sintética y casos concretos

La siguiente tabla es el **diseño propuesto de fixtures**, no afirma que esos documentos existan. Crear sus fuentes sintéticas con los valores indicados, ubicaciones conocidas y variantes ES/EN. Si se ajusta la colección al cerrar fase 00, conservar las cantidades y puertas acordadas y fijarla antes de evaluar.

| Caso | Fuentes y pregunta de prueba | Resultado que debe lograr |
|---|---|---|
| R01 | TXT dice «solicitar con 5 días de antelación»; preguntar el plazo | 5 días, respaldado y citado en líneas reales |
| R02 | Nota dice «aprueba la jefatura»; preguntar quién aprueba | Jefatura con cita al fragmento de la nota |
| R03 | TXT de R01 + nota de R02; preguntar cómo y ante quién solicitar | Combinar las dos fuentes, con respaldo separado |
| R04 | PDF con condiciones en página 2; preguntar la condición | Respuesta correcta y cita a página 2, no a primera coincidencia |
| R05 | JSON con `policy.maxDays = 10` y otro campo de valor igual; preguntar máximo de la política | 10 con ruta exacta de `policy.maxDays` |
| R06 | CSV con gasto permitido por categoría; preguntar una categoría concreta | Valor de fila/columna correctas, sin confundir otras categorías |
| R07 | XLSX con límite en segunda hoja; preguntar ese límite | Respuesta y cita en hoja/celda correctas |
| R08 | Fuente EN dice «approval is required before purchase»; preguntar en ES | Recuperación entre idiomas y respaldo del texto EN |
| R09 | Fuente ES especifica canal de soporte; preguntar en EN y luego «¿y quién lo atiende?» con responsable también documentado | Responder ambos turnos con evidencia vigente y contexto conversacional |
| R10 | DOCX/Markdown fija requisitos A y B; caso satisface ambos; preguntar si reúne los requisitos | Conclusión inferida, con premisas A/B citadas; no fingir cita literal |
| C01 | Mismo grupo/periodo: exigir aprobación desde USD 100 frente a eximirla por debajo de USD 200; preguntar por USD 150 | Posible conflicto de obligación con ambos lados, sin ganador |
| C02 | Mismo ámbito/periodo: eliminar registros al día 90 frente a conservarlos al menos 180 días | Posible incompatibilidad de retención, contexto y citas de ambos |
| C03 | Mismo colectivo/periodo: máximo 2 días remotos frente a autorización explícita de 3 | Conflicto potencial de límite, sin preferir la última cargada |
| C04 | Misma rama/equipo/periodo: autorización de fusionar con 1 aprobación frente a exigencia de al menos 2 | Conflicto potencial y evidencia de las dos reglas |
| D01 | 2 días remotos para contratistas; 3 para plantilla; preguntar si chocan | Reconocer poblaciones distintas; ningún falso conflicto |
| D02 | Límite regional A de USD 100 y regional B de USD 200; preguntar si chocan | Reconocer ámbito distinto; ningún falso conflicto |
| A01 | Colección sin política de vacaciones; preguntar días anuales | Abstenerse e identificar información faltante |
| A02 | Respuesta solo en documento no seleccionado; consultar seleccionando otros | Abstenerse; no ampliar selección sin permiso |
| A03 | Respuesta solo en fuente eliminada/reemplazada del historial | No usar extracto viejo como evidencia vigente; abstenerse si nada actual respalda |
| A04 | Respuesta solo en otro espacio con documento muy similar | Abstenerse; ese documento no llega a recuperación/contexto |

Completar cada caso con pregunta exacta, espacio, archivos, selección, idioma, evidencias admisibles, ubicación y criterios. URL, GitHub y código se validan además en la matriz funcional; la suite no sustituye pruebas de todos los formatos/fuentes.

## Pruebas y puertas de cierre

- [ ] **P06.1:** R01–R10 ejecutados con modelo real; respaldo y etiquetas revisados por afirmación.
- [ ] **P06.2:** C01–C04 muestran ambos lados y contexto; no resuelven automáticamente.
- [ ] **P06.3:** D01–D02 sin falsos conflictos.
- [ ] **P06.4:** A01–A04 sin fallo crítico de abstención; comprobar especialmente selección, historial y espacio antes de recuperar.
- [ ] **P06.5:** Validar todas las citas emitidas, incluidos casos que fallaron por otra razón, y abrir una evidencia de cada tipo de ubicación utilizado.
- [ ] **P06.6:** Repetir aislamiento/roles sin IA y guardar un informe de la ejecución completa, sin seleccionar solo resultados favorables.

## Entregables y criterio de finalización

- [ ] Fixtures y manifiesto de 20 casos, rúbrica ejecutable/revisable, comandos reales y resultados con modelo/configuración/coste.
- [ ] **Al menos 18/20** casos aprobados, **cero** fallos críticos de abstención, **cero** falsos conflictos de contexto y **todas** las citas verificables.
- [ ] Todas las pruebas de aislamiento/permisos aprobadas. Ninguna media favorable compensa un fallo crítico; no retirar casos fallidos para subir puntuación.

**Siguiente:** [fase 07](07-grafo-y-relaciones.md).
