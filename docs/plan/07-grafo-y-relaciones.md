# Fase 07 — Grafo 2D y relaciones con respaldo

**Estado:** Pendiente. **Dependencia:** [fase 06](06-contradicciones-y-evaluacion.md) verificada. [Índice](README.md).

**Fuente:** [grafo](../specification/05-grafo-y-previsualizacion.md) y [ciclo documental](../specification/03-ingesta-y-documentos.md). **Cobertura:** V03, V06–V08, V14–V17.

## Qué se debe lograr

Explorar documentos y conceptos del espacio mediante tres tipos de conexión identificables y con procedencia. La vista inicial es un subconjunto; búsqueda y filtros encuentran también elementos autorizados aún no dibujados.

## Backend BoxLang: tareas concretas

- [ ] **07.1 — Conceptos.** Extraer conceptos desde contenido disponible, conservar documentos/fragmentos que los respaldan y definir normalización mínima ES/EN. No presentar un concepto generado sin fuente.
- [ ] **07.2 — Similitud.** Calcular proximidad semántica usando embeddings existentes y criterios definidos en fase 00; conservar medida y método. El enlace significa similitud calculada, no una relación demostrada.
- [ ] **07.3 — Conceptos compartidos.** Vincular conceptos con documentos de respaldo y mostrar conexiones documentales derivadas de compartirlos; conservar origen e interpretación.
- [ ] **07.4 — Referencias explícitas.** Detectar enlaces/menciones inequívocas a documentos existentes del mismo espacio, guardar fragmento de origen y no enlazar automáticamente una coincidencia ambigua como referencia demostrada.
- [ ] **07.5 — Consulta acotada.** Operaciones de vista inicial, expansión por nodo y búsqueda/filtro sobre toda la colección autorizada. Definir límites/resumen del subconjunto y evitar respuesta masiva de 1.000 documentos y todas sus conexiones por defecto.
- [ ] **07.6 — Ciclo completo.** Agregar generación de relaciones a tareas y presupuesto; procesar documentos ya indexados antes de habilitar el grafo completo. Reemplazo elimina respaldo viejo, borrado retira conexiones/conceptos huérfanos y reintento no duplica.
- [ ] **07.7 — Publicación coherente.** Relaciones y vectores corresponden a revisión vigente. Una tarea antigua no añade enlaces de contenido borrado/reemplazado; comunicar procesamiento parcial sin presentar grafo actualizado si no lo está.

## Datos observables

| Elemento | Información necesaria |
|---|---|
| Nodo documento | Identidad, espacio, título/formato y referencia autorizada al visor |
| Nodo concepto | Identidad, etiqueta y documentos/fragmentos de respaldo |
| Conexión de similitud | Extremos autorizados, medida/método y tipo calculado |
| Conexión por concepto | Concepto compartido y fuentes que respaldan su presencia |
| Referencia explícita | Documento origen/destino y ubicación de la mención/enlace |
| Resultado acotado | Elementos devueltos, límites y señal de que no representan necesariamente la colección completa |

Persistir origen/respaldo aunque no exista un inspector dedicado en esta entrega. No incorporar una base de grafos: los datos se guardan en PostgreSQL según el diseño mínimo validado.

## Frontend Next.js

- [ ] Vista 2D con documentos y conceptos visualmente distintos, leyenda de conexiones y distinciones no basadas solo en color.
- [ ] Zoom, desplazamiento, búsqueda, filtros y expansión progresiva con estado de carga/error/vacío.
- [ ] Mostrar que la vista es parcial y no limitar búsquedas a elementos dibujados. Seleccionar resultado no visible permite incorporarlo/explorarlo según contrato.
- [ ] Seleccionar documento abre su información/previsualización mediante los permisos y visores existentes.
- [ ] Controles accesibles y operables por teclado cuando corresponda; cambio de espacio limpia grafo previo y descarta respuestas tardías.

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio |
|---|---|---|
| P07.1 | Ingerir documentos semejantes, con concepto compartido y referencia explícita | Los tres tipos de conexión existen y su origen es verificable |
| P07.2 | Inspeccionar respaldo de concepto/enlaces en datos | Sin conceptos huérfanos ni similitud etiquetada como hecho demostrado |
| P07.3 | Buscar documento fuera de vista inicial y filtrar | Encuentra elementos en colección autorizada, no solo en pantalla |
| P07.4 | Expandir/abrir documento y cambiar de espacio | Expansión acotada; visor autorizado; sin mezcla visual/datos |
| P07.5 | Reemplazar/borrar una fuente de concepto compartido | Retira respaldo viejo; concepto persiste solo si quedan otras fuentes |
| P07.6 | Reintentar o terminar tarea antigua tras borrar | Sin duplicación ni reaparición de enlaces eliminados |
| P07.7 | Manipular IDs de nodo/expansión de otro espacio | Backend deniega sin filtrar contenido ajeno al cliente |
| P07.8 | Explorar colección objetivo con teclado/zoom/búsqueda | Interacción utilizable, límites visibles y coste/latencia registrados |

## Entregables y criterio de finalización

- [ ] Datos/operaciones de relaciones documentados, grafo conectado a información real y migración/reprocesamiento de la colección previa completados.
- [ ] Pruebas del respaldo, del ciclo documental y de aislamiento; evidencia de navegador y regresión de la suite de conocimiento afectada.
- [ ] P07.1–P07.8 aprobadas. La aplicación no presenta éxito de grafo si su procesamiento pendiente/fallido deja relaciones obsoletas.

**No se incluye:** edición manual, posiciones persistidas, chat desde nodos ni contradicciones como conexiones. **Siguiente:** [fase 08](08-operacion-rendimiento-y-recuperacion.md).
