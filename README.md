# Second Brain

**Equipo: Out of the Box.** Base de un módulo reutilizable Pure BoxLang; sin lógica de negocio, API ni interfaz web.

## Entorno

- BoxLang CLI **1.18.0**, sobre el Java incluido en la imagen oficial.
- BoxLang AI (`bx-ai`) **3.5.0** y driver PostgreSQL (`bx-postgresql`) **1.2.0**, instalados al construir la imagen.
- PostgreSQL **17** con pgvector **0.8.7**, volumen persistente y verificación de disponibilidad.
- MCP oficial de documentación configurado exclusivamente para este proyecto en `opencode.json`.

BoxLang AI ofrece integración con PostgreSQL/pgvector para memoria vectorial y RAG. PostgreSQL almacena los vectores; `bx-ai` proporciona la integración. No hace falta agregar otra base vectorial para empezar.

## Levantar la base

Requisitos: Docker y Docker Compose. No necesitas Java, BoxLang ni CommandBox instalados en el equipo.

```bash
cp .env.example .env
# Edita .env y cambia POSTGRES_PASSWORD.
docker compose up -d --build --wait
docker compose exec boxlang boxlang tests/smoke.bxs
```

La prueba comprueba la carga del módulo, BoxLang AI, la conexión JDBC y una operación vectorial sin escribir datos ni consumir APIs de IA.

El contenedor `boxlang` permanece disponible como entorno CLI; **no ejecuta todavía una aplicación ni expone HTTP**. Para abrir el REPL:

```bash
docker compose exec boxlang boxlang
```

### PostgreSQL

- Desde otros contenedores: `postgres:5432`.
- Desde el equipo: `127.0.0.1:55433`, o el puerto configurado en `.env`.
- Datasource BoxLang: `secondBrain`.
- Base, usuario y contraseña: valores de `.env`.

```bash
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose logs -f
docker compose down
```

`docker compose down` conserva los datos. El script `docker/postgres/init.sql` habilita `vector` solo al inicializar un volumen vacío; no crea tablas de negocio. Cambiar las credenciales en `.env` no cambia las de una base ya inicializada.

Este entorno es de desarrollo: el usuario inicial de PostgreSQL es administrador. Antes de producción, crear un usuario de aplicación con permisos mínimos y gestionar secretos y copias de seguridad.

## MCP de documentación

Abre OpenCode desde esta carpeta para cargar `opencode.json`:

```bash
opencode
# O comprueba la conexión:
opencode mcp list
```

Endpoint: `https://boxlang.ortusbooks.com/~gitbook/mcp`. Es el MCP público de documentación; no es `bx-mcp` ni un servidor MCP del futuro agente.

## Alcance futuro, no implementado

Transformar documentos, código, notas, Markdown, PDFs y JSON en conocimiento utilizable: preguntas respaldadas por evidencia, conexiones entre fuentes, contradicciones y separación entre hechos e inferencias.

Posibles ampliaciones: ingesta continua, relaciones entre conceptos y componentes reutilizables de carga, particionado, indexación y recuperación. Pendientes: proveedor de IA, modelos de chat y embeddings, dimensiones vectoriales, esquema de datos y estrategia de ingesta. No se han creado tablas, índices vectoriales, loaders ni agentes.

## Referencias

- [Módulos Pure BoxLang](https://boxlang.ortusbooks.com/boxlang-framework/module-development/getting-started#pure-boxlang)
- [BoxLang con Docker](https://boxlang.ortusbooks.com/getting-started/running-boxlang/docker)
- [BoxLang AI](https://ai.ortusbooks.com)
- [pgvector](https://github.com/pgvector/pgvector)
