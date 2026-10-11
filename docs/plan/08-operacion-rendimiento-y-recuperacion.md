# Fase 08 — Operación, rendimiento y recuperación

**Estado:** Pendiente. **Dependencia:** [fase 07](07-grafo-y-relaciones.md) verificada. [Índice](README.md).

**Fuente:** [operación y límites](../specification/07-operacion-y-limites.md) y [seguridad](../specification/06-arquitectura-y-seguridad.md). **Cobertura:** V03, V06–V08 y V15–V19.

## Qué se debe lograr

Desplegar el prototipo para un grupo limitado, conservar datos, recuperar tareas y restaurar una copia real. Demostrar capacidad/latencias bajo condiciones publicadas, no prometer rendimiento a partir de la ejecución local de una pregunta.

## Infraestructura y backend BoxLang

- [ ] **08.1 — Despliegue privado.** Compose reproducible en hardware acordado, dominio/HTTPS y acceso limitado. No abrir registro libre a internet; PostgreSQL/originales y puertos internos no se exponen innecesariamente.
- [ ] **08.2 — Secretos y permisos.** Configuración protegida, `.env.example` sin valores reales, clave OpenAI solo en backend. Usuario PostgreSQL de aplicación con permisos mínimos y archivos privados con permisos adecuados.
- [ ] **08.3 — Sesiones/transporte.** Verificar cookies, protección de mutaciones y propagación de identidad entre navegador, Next.js y BoxLang bajo HTTPS. Probar la misma autorización que en desarrollo, sin confianza especial en cabeceras manipulables.
- [ ] **08.4 — Reinicios.** Reiniciar durante ingesta/reemplazo y reserva de IA; comprobar recuperación de trabajo, conciliación presupuestaria y rechazo de publicación obsoleta.
- [ ] **08.5 — Respaldo coherente.** Definir cómo obtener copia compatible de PostgreSQL y originales, periodo/retención y almacenamiento protegido. Restaurar en entorno independiente autorizado y verificar referencias, vectores y relaciones.
- [ ] **08.6 — Errores/logs.** Clasificar permisos, formato, límite, presupuesto y proveedor; no registrar claves, contraseñas, prompts completos ni contenido privado innecesario. Diagnóstico suficiente mediante identidad interna de operación y estado.
- [ ] **08.7 — Carga.** Ejecutar escenarios descritos abajo; contar todas las operaciones de IA y evitar que la prueba de carga agote presupuesto sin autorización.

## Frontend Next.js

- [ ] Ejecutar lint y compilación mediante los scripts existentes dentro del contenedor/entorno Docker; registrar los comandos efectivos y resultado.
- [ ] Recorrer registro, espacios, biblioteca, chat, conflictos, visores y grafo en ES/EN; errores, vacíos, carga y pérdida de acceso comprensibles.
- [ ] Revisión de teclado, foco, nombres de controles y distinciones no basadas exclusivamente en color. No declarar accesibilidad por tener solo textos alternativos.
- [ ] Comprobar tiempos de espera y respuestas tardías: ni documentos fallidos falsamente por presupuesto ni contenido de un espacio previo mostrado en otro.

## Escenarios de medición

Fijar antes de ejecutar: CPU/RAM/disco, versiones, colección y mezcla de formatos, tamaños, longitud de preguntas/respuestas, concurrencia de ingesta/chat, red, límites de OpenAI y configuración del grafo.

| Escenario | Qué medir | Objetivo/criterio |
|---|---|---|
| M08.1 — Capacidad documental | 1.000 documentos en un espacio, incluidos importados de GitHub | Biblioteca/búsqueda/grafo operativos y cuota no excedida por concurrencia |
| M08.2 — Usuarios | Hasta 30 usuarios simultáneos con mezcla de operaciones definida | Sin fugas de permisos, corrupción ni doble gasto; registrar errores/saturación |
| M08.3 — Preguntas estándar | Latencia desde envío hasta respuesta completa, no primer token | p95 ≤30 s bajo carga acordada; tamaño de muestra fijado antes |
| M08.4 — Texto pequeño | Desde aceptación de TXT ≤1 MB hasta disponibilidad de consulta | ≤60 s bajo carga de ingesta acordada |
| M08.5 — Archivos grandes | Formatos representativos hasta 50 MB, extracción e indexación | Cumplir objetivos específicos fijados en fase 00; no aplicar arbitrariamente 60 s a todos |
| M08.6 — Límites/agotamiento | Archivos/lotes excedidos, presupuesto y proveedor lento | Rechazo/estado explícito; sin truncamientos ni falsas disponibilidades |

Separar capacidad sin IA de latencia real con IA. Usar datos sintéticos y límites conservadores para medir carga; un proveedor simulado sirve para concurrencia/fallos, **no** para certificar los objetivos de respuesta con el modelo real. No excluir fallos/timeouts del informe.

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio |
|---|---|---|
| P08.1 | Acceder al servidor como usuario permitido/no permitido | HTTPS y exposición limitada; sin acceso público a base/originales |
| P08.2 | Reiniciar servicios con documentos, chat y grafo existentes | Persistencia y funcionamiento sin pérdida/mezcla de datos |
| P08.3 | Interrumpir tareas/reservas y recuperar | Sin duplicados, tareas obsoletas publicadas ni consumo disponible ficticio |
| P08.4 | Restaurar backup de base y originales en entorno limpio | Documentos/citas/vectores/relaciones consistentes y permisos conservados |
| P08.5 | Ejecutar M08.1–M08.6 | Informe completo con condiciones, resultados y desviaciones |
| P08.6 | Revisar SSRF, contenido activo, prompt injection y logs | Sin ejecución/acceso prohibido/secretos; fallos informativos seguros |
| P08.7 | Recorrer UI ES/EN por teclado y compilar frontend | Pantallas funcionales, controles utilizables y compilación/lint correctos |

## Entregables y criterio de finalización

- [ ] Procedimiento reproducible de despliegue, reinicio, respaldo y restauración; configuración de ejemplo y limitaciones documentadas.
- [ ] Informe de rendimiento con muestras/percentiles/errores/coste y evidencia de restauración real, no solo copia creada.
- [ ] P08.1–P08.7 aprobadas y objetivos medidos. Si un objetivo no se cumple, documentar y resolver el bloqueo o pedir aprobación para cambiarlo; no marcar fase verificada ocultando la desviación.

**No se incluye:** apertura pública ni endurecimiento integral de producción fuera del prototipo. **Siguiente:** [fase 09](09-aceptacion-y-entrega.md).
