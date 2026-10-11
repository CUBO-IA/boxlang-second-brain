# Second Brain

**Equipo: Out of the Box.** Módulo reutilizable Pure BoxLang con frontend Next.js y un único GET de prueba; sin lógica de negocio.

## Entorno

- BoxLang MiniServer y CLI **1.18.0**, sobre el Java incluido en la imagen oficial.
- Next.js **16.4.0** con App Router, TypeScript, Tailwind CSS, ESLint y React **19.3.0**, sobre Node.js **24**; generado con `pnpm create next-app@latest frontend --yes`, con dependencias fijadas en `frontend/package.json` y `frontend/pnpm-lock.yaml`.
- BoxLang AI (`bx-ai`) **3.5.0** y driver PostgreSQL (`bx-postgresql`) **1.2.0**, instalados al construir la imagen.
- PostgreSQL **17** con pgvector **0.8.7**, volumen persistente y verificación de disponibilidad.
- MCP oficial de documentación configurado exclusivamente para este proyecto en `opencode.json`.

BoxLang AI ofrece integración con PostgreSQL/pgvector para memoria vectorial y RAG. PostgreSQL almacena los vectores; `bx-ai` proporciona la integración. No hace falta agregar otra base vectorial para empezar.

## Levantar la base

Requisitos: Docker y Docker Compose. No necesitas Node.js, Java, BoxLang ni CommandBox instalados en el equipo.

```bash
cp .env.example .env
# Edita .env y cambia POSTGRES_PASSWORD.
docker compose up -d --build --wait
docker compose exec boxlang boxlang tests/smoke.bxs
docker compose exec -T frontend node --input-type=module < tests/http.mjs
```

La prueba comprueba la carga del módulo, BoxLang AI, la conexión JDBC y una operación vectorial sin escribir datos ni consumir APIs de IA.

### Frontend y API de prueba

- Frontend: http://localhost:3000. Muestra la respuesta real de BoxLang y un error si no puede conectar.
- Backend: `GET http://localhost:8080/api/health.bxm` → `{"status":"ok","backend":"BoxLang"}`.
- Otros métodos reciben `405 Method Not Allowed` con `Allow: GET`.
- Next.js consulta `http://boxlang:8080` desde el servidor mediante la red de Compose; no se necesita CORS ni una segunda API en Next.js.
- Puertos locales configurables con `FRONTEND_PORT` y `BACKEND_PORT` en `.env`.
- Los cambios en `frontend/app` y `backend` se reflejan sin reconstruir. Si cambias dependencias, reconstruye con `docker compose up -d --build --wait`.

```bash
curl http://localhost:8080/api/health.bxm
```

`tests/http.mjs` comprueba el JSON del GET, el rechazo de POST y que la página de Next.js recibió la respuesta del backend. El contenedor `boxlang` también conserva el CLI. Para abrir el REPL:

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
