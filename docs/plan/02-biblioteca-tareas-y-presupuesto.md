# Fase 02 — Biblioteca, tareas y presupuesto

**Estado:** En curso. A+B+C integrados: biblioteca/UI reales y ledger de presupuesto con pruebas de B aprobadas sin IA. Falta el cierre de verificación: concurrencia real de reservas y recuperación de presupuesto tras reinicio real, no solo simulación. [Informe A](evidence/phase02-platform-security.md), [entrega B](evidence/role-b-phase02-progress.md), [integración](evidence/phase02-merge.md). **Dependencia:** [fase 01](01-cuentas-espacios-y-permisos.md) verificada. [Índice](README.md).

**Fuente:** [ingesta](../specification/03-ingesta-y-documentos.md), [arquitectura](../specification/06-arquitectura-y-seguridad.md) y [operación](../specification/07-operacion-y-limites.md). **Cobertura:** V03, V05–V08, V16–V18.

## Qué se debe lograr

Guardar y gestionar documentos de forma privada y consistente, recuperar tareas fallidas y evitar que operaciones concurrentes gasten el mismo presupuesto disponible. Esta fase **no equivale a indexación**: hasta que el procesamiento real de fase 03 esté conectado, ningún documento se declara disponible por haber sido guardado.

## Backend BoxLang: tareas concretas

- [x] **02.1 — Volumen privado.** Añadir almacenamiento persistente escribible fuera de `backend/` y rutas públicas; el código actual está montado en solo lectura. Usar nombres internos controlados, conservar nombre/procedencia como metadatos y autorizar antes de servir el original.
- [x] **02.2 — Biblioteca.** Persistir identidad de documento, espacio, tipo/formato, procedencia, ubicación privada, tamaño, estado y revisión interna vigente. Registrar tarea y error recuperable sin exponer rutas internas o secretos al cliente.
- [x] **02.3 — Entrada.** Validar tamaño, contenido y tipo permitido. Aplicar 50 MB por archivo, 1.000 documentos por espacio y límites de fase 00; considerar cargas concurrentes y distinguir duplicado de reintento de una operación.
- [x] **02.4 — Tareas.** Crear tareas persistidas, reclamar su ejecución según estrategia validada y recuperar trabajo tras reinicio. Autorizar lectura/reintento; un lector no puede provocar reprocesamiento.
- [x] **02.5 — Publicación.** Asociar resultados a la revisión esperada. Una tarea solo publica si documento y revisión siguen vigentes. El reemplazo prepara lo nuevo sin destruir lo válido y limpia resultados temporales cuando falla.
- [x] **02.6 — Eliminación.** Retirar acceso/participación del documento y limpiar original y derivados con recuperación de fallos parciales. El borrado no se presenta como terminado si quedan residuos pendientes; una tarea atrasada no puede resucitarlo.
- [x] **02.7 — Presupuesto.** Registrar operación, modelo, estimación, reserva, uso/coste y resultado. Reservar atómicamente antes de cada llamada; limitar tamaño de llamadas para tener una estimación conservadora. Considerar embeddings, respuestas, conceptos y reintentos que consuman API. [Entrega B](evidence/role-b-phase02-progress.md).
- [x] **02.8 — Conciliación.** Liberar/conciliar reservas según el uso confirmado; definir tratamiento conservador si el proveedor pudo consumir pero no devolvió uso. Recuperar reservas huérfanas sin habilitar doble gasto; aplicar el periodo diario/tarifas acordados. Pruebas de B con dobles; no acredita cierre integrado por sí solo.

## Estados y consistencia que deben cumplirse

| Situación | Estado/resultado observable |
|---|---|
| Original aceptado, trabajo sin completar | Pendiente o procesando; no participa en consultas |
| Procesamiento completo publicado | Disponible; solo se habilita al existir el pipeline real |
| Formato no soportado | No compatible, con motivo; nunca disponible |
| Proveedor caído o extracción fallida | Fallido recuperable cuando proceda; acción explícita de reintento |
| Reemplazo en curso/fallido | Último contenido válido conservado; estado del intento nuevo separado |
| Presupuesto insuficiente | Mensaje específico y sin nueva llamada; no atribuirlo a corrupción del documento |
| Documento borrado durante tarea | No visible para nuevas consultas; resultado tardío descartado y limpiado |

Las garantías de publicación se prueban primero con archivos y registros. En fases 03 y 07 se vuelven a probar con vectores y relaciones reales; no dar por verificados derivados inexistentes.

## Frontend Next.js: pantallas y comportamiento

- [ ] Biblioteca del espacio con documento, fuente/formato, tamaño, estado e información útil del fallo; nunca mostrar archivos de otros espacios durante cambio de selección.
- [ ] Carga individual y múltiple con resultado por archivo. En un lote mixto, diferenciar aceptados y rechazados sin afirmar éxito completo.
- [ ] Acciones autorizadas de reemplazo, borrado y reintento; un lector solo consulta. Indicar que borrar conserva mensajes históricos y posibles extractos.
- [ ] Mostrar procesamiento y cambios de estado con el mecanismo mínimo validado; diferenciar permiso, límite, formato, presupuesto y proveedor.
- [ ] Informar del envío de contenido/consultas a OpenAI y del límite presupuestario, sin exponer clave ni datos de otras personas.

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio |
|---|---|---|
| P02.1 | Guardar archivo, reiniciar y pedir original como autorizado/ajeno | Persistencia y descarga autorizada; ajeno rechazado |
| P02.2 | Superar tamaño/cantidad con cargas simultáneas | Rechazo explícito sin exceder cuota ni crear disponibilidad falsa |
| P02.3 | Cargar lote con archivo válido, inválido y nombre malicioso | Resultado individual; sin salida de ruta privada ni ejecución |
| P02.4 | Fallar entre archivo y registro; reintentar/reiniciar | Recuperación consistente, sin originales huérfanos persistentes ni duplicados |
| P02.5 | Reemplazar/borrar mientras una tarea antigua termina | Lo válido se conserva ante fallo; tarea obsoleta no publica |
| P02.6 | Simular varias llamadas cuyo coste conjunto excede lo disponible | Reservas atómicas; llamadas denegadas no llegan al proveedor |
| P02.7 | Simular timeout, uso confirmado y reinicio con reserva abierta | Conciliación acorde a política documentada; sin doble gasto ni doble liberación |

Los dobles de proveedor sirven para estas pruebas de fallo/consumo; no acreditan uso real de IA. No gastar USD 20 reales para comprobar el límite.

## Entregables y criterio de finalización

- [ ] Migraciones, volumen y operaciones de biblioteca/tareas reales; contrato de estados, errores y reintentos documentado.
- [ ] Política de publicación y limpieza probada con fallos; presupuesto reutilizable obligatorio en las llamadas de fases siguientes.
- [ ] P02.1–P02.7 aprobadas, scripts y evidencia de UI registrados. La fase cierra el control de almacenamiento/tareas, no la recuperación de conocimiento.

**No se incluye:** S3, historial navegable de versiones, papelera ni un servicio de colas no justificado. **Siguiente:** [fase 03](03-ingesta-chat-y-evidencia.md).
