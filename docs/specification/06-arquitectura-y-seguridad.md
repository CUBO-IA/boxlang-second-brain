# 06 — Arquitectura y seguridad

## Tecnologías acordadas

| Componente | Decisión |
|---|---|
| Interfaz | Next.js y TypeScript |
| Backend y lógica de conocimiento | Módulo reutilizable Pure BoxLang |
| Integración de IA | BoxLang AI |
| Base de datos | PostgreSQL con pgvector |
| Embeddings | OpenAI `text-embedding-3-small` |
| Respuestas | OpenAI `gpt-6-luna` |
| Acceso a modelos | API de OpenAI directamente |
| Originales | Volumen persistente privado de Docker |
| Ejecución | Docker Compose |

`openai/text-embedding-3-small` expresa el proveedor y el modelo elegidos. En la API directa de OpenAI, el identificador documentado es `text-embedding-3-small`.

La propuesta es utilizar **1.536 dimensiones**, el valor predeterminado documentado de ese modelo. Su adopción en el esquema y la integración instalada debe confirmarse antes de implementar.

Las versiones de módulos se declaran en `box.json`; el Dockerfile las instala desde ese descriptor. No se instalarán runtimes ni módulos globalmente en el equipo.

## Responsabilidades

- **Next.js:** interfaz, interacción con usuarios, grafo y previsualizadores.
- **BoxLang:** permisos y lógica de negocio, ingesta, recuperación y respuestas.
- **BoxLang AI:** reutilizar sus integraciones de embeddings, modelos, loaders y PostgreSQL/pgvector donde cubran los requisitos.
- **PostgreSQL:** cuentas, espacios, metadatos, contenido extraído, vectores y datos de relaciones e historial que necesite la aplicación.
- **Volumen privado:** originales y contenido importado que deba conservarse fuera de la base.

Los datos concretos, tablas, endpoints y estrategia de procesamiento todavía no están diseñados. Esta división no autoriza crear abstracciones especulativas ni duplicar lógica de negocio en Next.js.

## Almacenamiento

BoxLang ofrece funciones de carga y manejo de archivos. Para el prototipo se acuerda usar esas capacidades con un volumen persistente, no un servicio S3.

PostgreSQL guarda el conocimiento y las referencias a los originales; los binarios de los documentos no se almacenarán allí en esta entrega. Los originales estarán fuera de rutas públicas y se servirán únicamente después de comprobar autorización.

El diseño debe contemplar consistencia entre archivos y registros durante ingesta, reemplazo, borrado y fallos.

## Reutilización

El núcleo de ingesta, recuperación y respuestas permanece en BoxLang, independiente de la interfaz y reutilizable por otros consumidores.

Se revisarán primero las capacidades existentes. No se incorpora otra base vectorial, una base de grafos o una nueva capa de almacenamiento salvo necesidad demostrada y acordada.

## Seguridad obligatoria

- Autorización en backend para documentos, originales, citas, chats, grafos y tareas.
- Restricción al espacio autorizado antes de recuperar contenido para la IA; no basta con ocultarlo en la interfaz o filtrarlo después de recuperar resultados.
- Revalidación de acceso tras cambios de membresía o roles.
- Contraseñas protegidas, sesiones seguras y límites de intentos.
- HTTPS en el servidor privado.
- Protección contra enumeración de cuentas.
- Validación de formatos, tamaños y contenido.
- Protección contra rutas maliciosas, SSRF y archivos comprimidos abusivos.
- Saneamiento del contenido renderizado, incluidos Markdown y HTML importado.
- Prohibición de ejecutar código importado, macros o instrucciones contenidas en documentos.
- Documentos tratados como fuentes no confiables, no como instrucciones del agente.
- Secretos únicamente en configuración protegida, nunca en repositorio, navegador ni respuestas.
- No registrar credenciales o contenido privado innecesario en logs.
- Gestión explícita de errores, reintentos y fallos del proveedor.

El envío de contenido a OpenAI está permitido para este prototipo. Esa autorización no elimina la necesidad de informar al usuario sobre el tratamiento externo de documentos y consultas.

## Referencias verificadas

- [BoxLang: FileUpload](https://boxlang.ortusbooks.com/boxlang-framework/modularity/web-support/reference/built-in-functions/web/fileupload).
- [BoxLang AI](https://ai.ortusbooks.com).
- [OpenAI: text-embedding-3-small](https://developers.openai.com/api/docs/models/text-embedding-3-small).
- [OpenAI: embeddings y dimensiones](https://developers.openai.com/api/docs/guides/embeddings).
- [OpenAI: GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).

La disponibilidad documentada de los modelos en OpenAI no confirma su funcionamiento mediante la versión instalada de BoxLang AI. Las comprobaciones pendientes se detallan en [aceptación y pendientes](08-aceptacion-y-pendientes.md#validaciones-técnicas-previas).
