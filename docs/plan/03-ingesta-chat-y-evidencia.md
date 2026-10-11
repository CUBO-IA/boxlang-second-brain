# Fase 03 — Ingesta TXT/notas, chat y evidencia

**Estado:** Pendiente. **Dependencia:** [fase 02](02-biblioteca-tareas-y-presupuesto.md) verificada. [Índice](README.md).

**Fuente:** [ingesta](../specification/03-ingesta-y-documentos.md), [consultas](../specification/04-consultas-y-evidencia.md) y [conversaciones](../specification/02-usuarios-y-espacios.md#conversaciones-privadas-y-compartidas). **Cobertura:** V03–V11, V15–V17 y V20.

## Qué se debe lograr

Completar el primer recorrido con datos reales: cargar dos TXT o notas, indexarlos mediante BoxLang AI, preguntar, recibir afirmaciones clasificadas y abrir cada cita en el fragmento exacto. Funciona sin respuestas prefabricadas y el núcleo puede invocarse sin Next.js.

## Flujo de demostración

1. Editor carga un TXT con requisitos de solicitud y crea una nota con el responsable de aprobación; cada fuente contiene parte de la respuesta.
2. Ambos pasan a disponibles solo después de extracción, embeddings e indexación real.
3. Lector pregunta «¿Cómo solicito la aprobación y quién la concede?» en el espacio; la respuesta usa ambas fuentes.
4. Abre una cita: el visor muestra líneas/fragmento correctos y resalta el respaldo.
5. Pregunta algo ausente de las fuentes: obtiene abstención, no conocimiento externo presentado como documental.
6. Autor comparte la conversación; otro miembro puede leerla, pero no continuarla. Tras descompartir, pierde ese acceso.

## Backend BoxLang: tareas concretas

- [x] **03.1 — Notas y extracción.** Crear/editar notas y extraer TXT conservando líneas o identificadores de fragmentos normalizados. Definir tratamiento de encoding y saltos de línea para que extracción y visor coincidan. *(Role B núcleo + dobles; ver [evidence/role-b-phase02-progress.md](evidence/role-b-phase02-progress.md).)*
- [x] **03.2 — Fragmentos.** Particionar según decisión de fase 00, conservar ubicación de origen aunque cruce límites y asociar cada fragmento a espacio, documento y revisión interna. Una ubicación se calcula a partir del contenido, nunca se pide al modelo. *(Role B)*
- [x] **03.3 — Indexación.** Generar embeddings (vía caller con presupuesto) y publicar solo resultados completos; reemplazo/eliminación de fragmentos. *(Dobles en tests; IA real pendiente de corrida autorizada.)*
- [x] **03.4 — Recuperación.** Autorizar espacio y documentos seleccionados antes de buscar; no ampliar selección vacía/ajena. *(Role B SQL)*
- [x] **03.5 — Respuesta.** Afirmaciones ligadas a fragmentos recuperados; IDs/ubicaciones validados; abstención si no es verificable. *(Role B + dobles)*
- [x] **03.6 — Clasificación.** Etiquetas supported/inferred/uncertain; inferencias con premisas; abstención sin evidencia. *(Role B)*
- [ ] **03.7 — Conversaciones.** Persistir autor, espacio, mensajes, selección y citas. Privadas por defecto; compartir/descompartir requiere autoría. Lectura compartida requiere membresía vigente; continuación siempre requiere autoría, aunque el lector sea administrador.
- [ ] **03.8 — Historial seguro.** Usarlo como contexto conversacional, no como evidencia vigente; no reenviar al proveedor extractos de fuentes obsoletas o inaccesibles como respaldo. Conservar mensajes históricos accesibles según permisos y marcar citas reemplazadas/eliminadas.
- [x] **03.9 — Reutilización.** Prueba CLI BoxLang que invoque ingesta/recuperación/respuesta del núcleo, sin navegador ni llamadas a Next.js. *(Role B: `tests/knowledge-core-cli.bxs`, `tests/knowledge-p03.bxs`; HTTP/A/C pendientes.)*

## Contratos observables mínimos

Los nombres/campos serializados se fijan con el contrato validado; estas relaciones son obligatorias.

| Elemento | Información que debe conservar |
|---|---|
| Fragmento | Espacio, documento, revisión interna, texto y ubicación de origen |
| Afirmación | Texto, etiqueta y referencias a citas; premisas si es inferida |
| Cita | Documento/procedencia, fragmento de apoyo, ubicación, afirmación asociada y estado de fuente |
| Conversación | Autor, espacio, privada/compartida, mensajes y evidencia histórica |
| Error | Categoría segura y acción posible, sin prompt privado, credenciales ni rutas internas |

## Frontend Next.js: pantallas y comportamiento

- [ ] Crear/editar nota; visores TXT con líneas y notas normalizadas con ubicación estable.
- [ ] Chat con historial, pregunta de seguimiento y elección explícita de todo el espacio o documentos concretos.
- [ ] Presentar etiquetas por afirmación, premisas y citas; abrir visor en ubicación exacta y resaltar solo la evidencia asociada.
- [ ] Conversaciones propias y compartidas según permisos; la compartida de otro autor no permite enviar mensajes.
- [ ] Fuentes reemplazadas/eliminadas conservan marca histórica y no abren contenido nuevo como si fuera evidencia antigua. Mostrar carga, error y falta de evidencia en ES/EN.

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio |
|---|---|---|
| P03.1 | Ejecutar el flujo con dos fuentes y llamadas reales | Respuesta multifuente, uso registrado y citas exactas |
| P03.2 | Limitar selección a una fuente y preguntar sobre la otra | Sin fuga de la fuente no seleccionada; abstención/límites explícitos |
| P03.3 | Pregunta ausente e inferencia con premisas | Abstención correcta; inferencia etiquetada y respaldada por premisas |
| P03.4 | Preguntar ES sobre EN y EN sobre ES; hacer seguimiento | Recuperación cruzada y contexto sin mezclar espacios |
| P03.5 | Compartir, intentar continuar como otro usuario y descompartir | Lectura permitida mientras compartida; continuación/lectura posterior denegadas |
| P03.6 | Reemplazar/borrar fuente y preguntar de nuevo en chat previo | Nuevas respuestas sin evidencia vieja; citas históricas marcadas, sin resaltado engañoso |
| P03.7 | Retirar miembro, manipular IDs e intentar recuperar/citar | Sin acceso a chats, texto, originales o fragmentos ajenos |
| P03.8 | Inyectar cita inválida e instrucciones en documento sintético | Cita inválida no publicada; contenido no cambia permisos ni revela secretos |
| P03.9 | Invocar núcleo por CLI sin Next.js y repetir reintento/borrado | Conocimiento real reutilizable; sin duplicados ni resultados obsoletos |

## Entregables y criterio de finalización

- [ ] Pipeline TXT/notas conectado a tareas/presupuesto, contratos de respuesta/cita y conversaciones persistentes.
- [ ] Chat y dos visores funcionales, pruebas sin IA separadas de evaluación real de proveedor y CLI reutilizable.
- [ ] P03.1–P03.9 aprobadas y regresión de seguridad/ciclo documental. El grafo y los demás formatos siguen pendientes, no se presentan como implementados.

**Siguiente:** [fase 04](04-formatos-y-previsualizadores.md).
