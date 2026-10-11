# 08 — Aceptación y pendientes

## Suite de conocimiento

Se utilizará una colección sintética ES/EN y una suite reproducible de **20 casos**:

| Tipo de caso | Cantidad |
|---|---:|
| Preguntas respondibles | 10 |
| Contradicciones | 4 |
| Diferencias de contexto que no son contradicciones | 2 |
| Preguntas sin evidencia | 4 |

Cada caso especificará las fuentes, el resultado esperado y las evidencias admisibles. La evaluación se realiza por resultados y respaldo, no por redacción idéntica.

### Umbrales acordados

- Al menos **90 % de calidad global**: 18 de los 20 casos deben cumplir sus criterios.
- Ningún fallo crítico de abstención en los casos sin evidencia.
- Ningún falso conflicto en los casos de diferencias de contexto.
- Todas las citas deben ser verificables.
- Todas las pruebas de aislamiento y permisos deben aprobarse.

Una métrica global favorable no compensa un fallo de aislamiento, una cita inválida o los fallos críticos anteriores. El resultado solo acredita esta colección de prueba, no precisión universal.

## Comprobaciones funcionales

- Registrar e iniciar sesión sin servicio de correo, con la limitación de identidad documentada.
- Crear espacios y comprobar roles de administrador, editor y lector.
- Incorporar cuentas existentes y devolver una respuesta genérica para cuentas inexistentes, sin invitaciones pendientes.
- Aislar documentos, recuperación, chats, citas, grafos y originales entre espacios.
- Compartir un chat en lectura, retirar su acceso y aplicar cambios de membresía.
- Ingerir cada formato y fuente admitidos; no depender únicamente de PDFs o de un único documento para la demo.
- Detectar formatos no compatibles y fallos sin confirmar falsamente la indexación.
- Responder utilizando evidencia de varias fuentes y etiquetas por afirmación.
- Navegar y resaltar citas en los formatos admitidos.
- Mostrar posibles contradicciones con evidencia de ambos lados, sin resolverlas automáticamente.
- Explorar el grafo de documentos y conceptos y abrir sus documentos.
- Actualizar manualmente URLs y repositorios.
- Reemplazar y eliminar documentos, retirar sus derivados y señalar citas históricas obsoletas.
- Gestionar reintentos, fallos de proveedor y agotamiento de presupuesto.
- Verificar interfaz ES/EN y consultas sobre documentos ES/EN.

## Ejecución de pruebas

- Las pruebas que consumen API estarán separadas de las que no requieren IA externa.
- Cada evaluación registrará modelo, configuración y resultados.
- Las comprobaciones se ejecutarán dentro del entorno Docker Compose.
- Los objetivos de capacidad y rendimiento se medirán con condiciones documentadas.

La comprobación de infraestructura existente se conserva:

```bash
docker compose exec boxlang boxlang tests/smoke.bxs
```

Esta prueba no sustituye las futuras pruebas funcionales o de conocimiento y no implica que esas funcionalidades ya existan.

## Entrega del hackathon

- Configuración Docker Compose reproducible.
- Variables de ejemplo sin secretos.
- Documentación de instalación, configuración y límites.
- Datos sintéticos y guion de demostración del flujo principal.
- Pruebas ejecutables y resultados de evaluación.
- Núcleo de conocimiento reutilizable en Pure BoxLang, separado de Next.js.
- Declaración de componentes previos y trabajo realizado durante el evento.
- Identificación del uso real de BoxLang AI y de los modelos elegidos.
- Créditos y licencias de dependencias.
- Cumplimiento del [checklist del hackathon](../../REQUISITOS-HACKATHON.md).

## Validaciones técnicas previas

Antes de cerrar el diseño de implementación:

1. **Modelo de respuestas:** comprobar acceso a `gpt-6-luna` mediante la versión instalada de BoxLang AI y el endpoint compatible. La documentación de OpenAI establece restricciones según API y uso de herramientas; no se presupone soporte de Responses en el módulo.
2. **Recuperación aislada:** verificar filtros por espacio aplicados antes de recuperar contenido, utilizando la integración existente de PostgreSQL/pgvector.
3. **Ciclo de documentos:** confirmar capacidades de eliminación y reemplazo de vectores y sus metadatos.
4. **Loaders:** revisar soporte real de los formatos, dependencias para DOCX y XLSX y posibles módulos adicionales. No se presupone que todos sean loaders nativos de BoxLang AI.
5. **Ubicaciones:** probar conservación de páginas, líneas, rutas JSON, hojas/celdas y fragmentos normalizados. La existencia de un loader no garantiza citas precisas.
6. **Embeddings:** confirmar 1.536 dimensiones en integración, vectores y esquema antes de crearlo.
7. **Visores y grafo:** revisar dependencias disponibles y validar navegación, resaltado, accesibilidad y rendimiento antes de escoger bibliotecas.
8. **Límites de procesamiento:** concretar máximos de importación, contenido expandido y fragmentos, junto con manejo de errores y reintentos.
9. **Operación:** definir recursos del servidor, HTTPS, respaldo y condiciones de medición de rendimiento, incluidos archivos grandes.
10. **Presupuesto y evaluación:** concretar periodo diario, estimación de coste, control concurrente y rúbrica reproducible de los casos.

Estas validaciones no autorizan sustituir los modelos elegidos, omitir funciones o crear infraestructura adicional sin consultarlo. La especificación funcional está acordada; las decisiones técnicas restantes deben apoyarse en esas comprobaciones.
