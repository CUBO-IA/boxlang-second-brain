# Revisión final de rama — Fase 03

Alcance: `d43cd4d..b374be0` (16 commits; 47 archivos). Revisión del diff completo y sus contratos, sin modificar producto, ejecutar suites ni hacer llamadas a proveedores.

## Veredicto

- **Cumplimiento de especificación:** implementación amplia y coherente con el alcance TXT/notas, chat, evidencia y permisos. La fase correctamente sigue **En curso**, no verificada: la aceptación real se detuvo en el registro sintético HTTP 500 antes de embedding/chat. No se presenta como aprobada.
- **Calidad para publicar:** **NO-GO en el momento de la revisión** por el hallazgo Important de abajo, resuelto después (ver estado posterior). No encontré hallazgos Critical.

## Hallazgos

### Important — Una actualización fallida oculta la revisión aún vigente del chat

`backend/secondBrain/KnowledgeIndex.bx:27-32` cambia la fila `knowledge_documents` a la revisión candidata y estado `staging` al comenzar a indexar, antes de publicarla. Pero `backend/secondBrain/ConversationService.bx:147-160` solo considera disponibles documentos cuyo marcador coincide con `documents.current_version` y tiene estado `indexed`. Si falla el worker (`backend/secondBrain/LibraryTaskWorker.bx:39-51`), conserva correctamente la revisión anterior en biblioteca, pero deja ese marcador en `staging`.

**Ruta de fallo:** indexar una sustitución de TXT/nota de un documento existente y obtener error de proveedor/presupuesto. La biblioteca y las citas históricas siguen mostrando la revisión antigua como vigente, pero una nueva pregunta con selección explícita recibe `400 invalid_scope`; una consulta de todo el espacio omite la fuente. Si la sustitución queda fallida sin reintento, la fuente anterior queda excluida del chat indefinidamente. Esto contradice el requisito de que una sustitución fallida no destruya ni retire la última información válida.

**Acción:** separar el marcador publicado del estado de staging, o restaurar el marcador de la revisión vigente cuando falle la candidata. Añadir una regresión que intente consultar la revisión anterior después de un reemplazo fallido.

### Minor — `offset` y `afterSequence` aceptan valores mal formados por coerción

`backend/secondBrain/ConversationService.bx:367-372` convierte parámetros con `val()` antes de validarlos. Por ejemplo, `offset=abc` o `afterSequence=abc` se convierten en cero y se aceptan como primera página en vez de devolver 400. No amplía el alcance ni evade autorización, pero incumple el contrato de entrada estrictamente tipada.

## Pendientes documentados que no son hallazgos nuevos

- La aceptación real P03.1–P03.9 permanece pendiente; el intento falló antes de cualquier llamada real de chat y no debe sustituirse por pruebas con dobles. No hice llamadas ni repetí esa aceptación.
- Citas históricas sin offsets precisos fallan de forma segura y no inventan resaltados.
- Otros formatos, grafo/contradicciones, TLS y backups siguen fuera del alcance de esta fase.
- Los informes registran verificaciones deterministas, proxy/UI, TypeScript, lint y navegador sintético aprobadas; no las repetí.

## Estado posterior — 2026-10-11

Los hallazgos Important y Minor anteriores están resueltos; ver `final-fix-report.md` para cambios y evidencia determinista. La fase continúa **En curso**: la aceptación real P03 sigue pendiente y no se considera aprobada.
