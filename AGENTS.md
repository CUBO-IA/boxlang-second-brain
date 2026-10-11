# Second Brain — Out of the Box

- Proyecto base: módulo reutilizable Pure BoxLang. No implementar funcionalidades sin una petición explícita.
- Usar el MCP `boxlang-docs` de OpenCode para consultar la documentación oficial.
- BoxLang AI ya integra PostgreSQL/pgvector: reutilizar esa integración antes de crear componentes propios.
- Ejecutar con Docker Compose; no instalar runtimes ni módulos globalmente en el equipo.
- Comprobar infraestructura con `docker compose exec boxlang boxlang tests/smoke.bxs`.
- Las versiones de módulos se declaran en `box.json`; el Dockerfile las instala desde ese descriptor.
- No guardar credenciales, documentos privados ni claves de IA en el repositorio.
- Futuro alcance: ingesta multiformato, recuperación con evidencia, contradicciones y separación de hechos e inferencias. Todavía no hay decisiones sobre proveedor, modelos, dimensiones ni esquema de datos.
