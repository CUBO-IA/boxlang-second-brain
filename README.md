# Second Brain

**Equipo: Out of the Box.** Módulo reutilizable Pure BoxLang para cuentas, espacios, sesiones, permisos y almacenamiento privado/tareas de biblioteca (fase 02). Frontend Next.js con biblioteca y delegación same-origin a BoxLang. Todavía no hay pipeline de ingesta/IA conectado a la biblioteca: guardar originales no los hace disponibles para consultas.

## Entorno

- BoxLang MiniServer/CLI **1.18.0+66** y Java incluido en la imagen.
- Next.js **16.4.0**, React **19.3.0**, TypeScript, Tailwind CSS y ESLint; Node.js **24.21.0** dentro del contenedor.
- BoxLang AI (`bx-ai`) **3.5.0**, driver PostgreSQL (`bx-postgresql`) **1.2.0** y PostgreSQL **17.11** con pgvector **0.8.7**.
- Docker Compose; no hace falta instalar runtimes ni módulos en el equipo.

BoxLang AI ya integra PostgreSQL/pgvector para memoria vectorial y RAG. Las pruebas de fase 01 son deterministas y no realizan llamadas de IA.

## Levantar el entorno

Requisitos: Docker y Docker Compose. Crea `.env` desde `.env.example` y establece una contraseña de PostgreSQL.

```bash
cp .env.example .env
# Edita .env y cambia POSTGRES_PASSWORD.
FRONTEND_PORT=3002 BACKEND_PORT=8082 POSTGRES_PORT=55435 docker compose -p second-brain-phase01 up -d --build --wait
docker compose -p second-brain-phase01 exec boxlang boxlang backend/migrations/migrate.bxs
docker compose -p second-brain-phase01 exec boxlang boxlang tests/smoke.bxs
```

La migración de cuentas es versionada e idempotente; ejecútala también al actualizar un volumen existente. Servicios locales: frontend `http://127.0.0.1:3002`, BoxLang `http://127.0.0.1:8082`, PostgreSQL `127.0.0.1:55435`. El health endpoint es `GET /api/health.bxm`.

`APP_ORIGIN` debe coincidir exactamente con el origen público del navegador. En producción configura un origen `https://` detrás de TLS; la cookie de sesión recibe `Secure`. HTTP solo se admite para `localhost` o `127.0.0.1`. No publiques estos servicios directamente a Internet.

`APP_ORIGIN` explícito prevalece; si se omite, Compose lo deriva de `FRONTEND_PORT` (por defecto `http://127.0.0.1:3000`). Para `localhost`, HTTPS o un dominio, configura el origen exacto que usa el navegador. Los puertos Compose pueden ajustarse con `FRONTEND_PORT`, `BACKEND_PORT` y `POSTGRES_PORT`.

## API de fase 01

Next.js permite únicamente estas rutas same-origin y las delega a `backend/api/account.bxm`; autorización, persistencia y reglas de negocio viven en `backend/secondBrain/AccountService.bx`.

| Ruta | Método | Resultado correcto |
|---|---|---|
| `/api/auth/register` | POST | `202`; cuerpo genérico `{"message":"Solicitud procesada"}`, también para correo duplicado |
| `/api/auth/login` | POST | `200`; usuario y token CSRF en JSON, sesión opaca solo en cookie HttpOnly |
| `/api/auth/current` | GET | `200`; usuario y token CSRF de la sesión vigente |
| `/api/auth/logout` | POST | `200`; invalida sesión y expira la cookie |
| `/api/spaces` | GET / POST | `200` lista propia / `201` crea espacio con rol admin atómico |
| `/api/spaces/:spaceId` | GET | `200` solo si hay membresía efectiva |
| `/api/spaces/:spaceId/members` | GET / POST | `200`; gestión solo admin. Incorporar cuenta existente o inexistente da el mismo `Solicitud procesada` y nunca crea invitación |
| `/api/spaces/:spaceId/members/:memberId` | PATCH / DELETE | `200`; cambiar rol o retirar miembro. `409` si se intenta quitar/degradar al último admin |

Correos se recortan y pasan a minúsculas; contraseñas admiten 12–128 caracteres. Se usa PBKDF2-HMAC-SHA256, 600.000 iteraciones, salt aleatorio de 16 bytes y resultado de 32 bytes, comparado en tiempo constante. Las sesiones usan 32 bytes aleatorios; PostgreSQL guarda solo SHA-256 del token, expiran a las 12 horas y no se exponen en JSON/localStorage.

La cookie es `HttpOnly; SameSite=Lax; Path=/; Max-Age=43200` y añade `Secure` con `APP_ORIGIN` HTTPS. Registro/login comprueban `Origin`; toda mutación autenticada comprueba `Origin` y CSRF. El límite de registro/login es 10 intentos por correo y ventana de 15 minutos, con contabilidad persistida en PostgreSQL.

Roles persistidos: `admin`, `editor`, `reader`. Todos los miembros leen; admin/editor quedan autorizados para futuras escrituras de documentos; solo admin gestiona membresías. Errores relevantes: `400` entrada inválida, `401` sesión/credenciales no válidas, `403` Origin/CSRF o permiso denegado, `409` último admin y `429` límite de intentos.

## Comprobaciones de fase 01

Ejecuta dentro del mismo proyecto Compose. La suite HTTP usa API BoxLang, Next.js y PostgreSQL reales; elige un `P01_RUN` nuevo para cada ejecución:

```bash
docker compose -p second-brain-phase01 exec boxlang boxlang tests/phase01-crypto.bxs
docker compose -p second-brain-phase01 exec boxlang boxlang tests/phase01-expiry.bxs
P01_RUN=phase01-check-01 docker compose -p second-brain-phase01 exec -T -e P01_RUN=phase01-check-01 -e BOXLANG_URL=http://boxlang:8080 -e P01_FRONTEND_URL=http://127.0.0.1:3000 -e P01_ORIGIN=http://127.0.0.1:3002 frontend node --input-type=module < tests/phase01-http.mjs
P01_RUN=phase01-check-01 docker compose -p second-brain-phase01 exec -e P01_RUN=phase01-check-01 boxlang boxlang tests/phase01-audit.bxs
```

`phase01-cleanup.bxs` elimina únicamente las cuentas sintéticas del slug indicado; úsalo solo después de terminar pruebas y auditorías. La interfaz ES/EN ofrece registro, login, espacios, gestión de miembros y avisos de sesión revocada. El correo declarado no verifica identidad y no hay recuperación de contraseña por email.

Desde el contenedor, el CLI sigue disponible con `docker compose -p second-brain-phase01 exec boxlang boxlang`. Desde otros contenedores PostgreSQL está en `postgres:5432`; la datasource BoxLang es `secondBrain`. Los archivos de `frontend/app` y `backend` se montan para desarrollo; reconstruye si cambias dependencias.

## Probe opt-in de OpenAI

La clave opcional se pasa **solo al contenedor BoxLang**, nunca al frontend. Compose configura `P00_ALLOW_PROVIDER_CALLS=NO` por defecto; no hay llamadas al iniciar servicios. Para habilitar la prueba manualmente, agrega `OPENAI_API_KEY` al `.env` privado e ignorado de este worktree; no copies la clave al repo, a este chat ni a logs. Luego recrea BoxLang para cargar el entorno y habilita la prueba únicamente al ejecutar el script:

```bash
docker compose -p second-brain-phase01 up -d --no-deps boxlang
P00_ALLOW_PROVIDER_CALLS=YES docker compose -p second-brain-phase01 exec -e P00_ALLOW_PROVIDER_CALLS=YES boxlang boxlang tests/provider.bxs
```

El `.env.example` deja `P00_MAX_USD=1` y fecha/fuente/tarifas explícitas. Según el precio **Standard** publicado a **2026-10-11**, el probe actual usa `gpt-6-luna`: USD 0.10/M tokens de entrada y USD 0.50/M de salida; `text-embedding-3-small`: USD 0.02/M de entrada. Referencias: [modelo GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [precios API](https://developers.openai.com/api/docs/pricing) y [modelos de embeddings](https://developers.openai.com/api/docs/guides/embeddings). Las tarifas pueden variar por modalidad y procesamiento regional; vuelve a confirmar fecha, tipo de endpoint y tarifa antes de permitir llamadas.

Los probes sintéticos validaron chat/embedding reales, uso, 1.536 dimensiones y roundtrip pgvector. El parser científico de bx-ai se corrige únicamente durante el build, con guard de versión/fuente. El [cierre técnico](docs/plan/evidence/phase00-closure.md) registra resultados y coste acumulado; el [histórico](docs/plan/evidence/provider-phase00.md) conserva el fallo previo. No se cambió de modelo ni se hicieron llamadas nuevas al integrar. El guard requiere opt-in explícito, tarifas/fecha/referencia válidas y techo en `(0, 1]` USD; no pongas el opt-in permanente en `.env`.

## MCP y documentación

Abre OpenCode desde esta carpeta para cargar `opencode.json` o consulta el MCP configurado en `https://boxlang.ortusbooks.com/~gitbook/mcp`. Referencias: [módulos Pure BoxLang](https://boxlang.ortusbooks.com/boxlang-framework/module-development/getting-started#pure-boxlang), [BoxLang Docker](https://boxlang.ortusbooks.com/getting-started/running-boxlang/docker), [BoxLang AI](https://ai.ortusbooks.com) y [pgvector](https://github.com/pgvector/pgvector).

Estado: fases **00 y 01 Verificadas** en la carpeta original. El [registro de revisión](docs/plan/evidence/phase00-review.md) documenta el cierre de viabilidad, pruebas vectoriales/visores y revalidación de cuentas/permisos; no acredita las fases posteriores.

Comprobaciones de fase 00 sin llamadas IA:

```bash
docker compose exec -T boxlang boxlang tests/vector-roundtrip.bxs
docker compose exec -T boxlang boxlang tests/probe.bxs
docker compose exec -T frontend node /tests/contracts.mjs
docker compose run --rm --no-deps -v "$PWD:/repo:ro" -w /repo frontend node tests/viewer-fixtures.mjs
```

La ruta de desarrollo `http://127.0.0.1:3000/feasibility` abre únicamente fixtures sintéticos fijos; incluye PDF original y Markdown renderizado con citas resaltadas. El subset Office, las licencias y límites están en el cierre técnico; no equivale a ingesta ni a visores privados de documentos de usuarios.

## Alcance futuro, no implementado

La biblioteca todavía no conecta ingesta multiformato, recuperación con evidencia, contradicciones ni separación entre hechos e inferencias. B aporta un núcleo CLI provisional y ledger, no RAG de producto ni conciliación de facturación. Despliegue HTTPS, backups y rendimiento aún no se ejecutaron. No se han guardado secretos, documentos privados ni claves de IA en el repositorio.

## Fase 02 — integración A+B+C

Migración 2 de biblioteca, migración 3 de presupuesto/conocimiento y volumen privado `originals_data`; API BoxLang y UI Next.js de carga por archivo/lote, listado, descarga autorizada, tareas/reintentos, reemplazo y borrado recuperable. Conserva la última revisión publicada y rechaza tareas obsoletas. El aviso presupuestario usa el ledger de B, sin exponer consumo ajeno. **Fase 02 Verificada:** concurrencia, recuperación tras reinicio y UI aprobadas sin IA. No se activa ingesta ni IA. [Evidencia de cierre](docs/plan/evidence/phase02-closure.md).

```sh
docker compose up -d --no-deps --wait boxlang
docker compose exec -T boxlang boxlang backend/migrations/migrate.bxs
docker compose exec -T -e P02_RUN=core-check-01 boxlang boxlang tests/phase02-core.bxs
docker compose exec -T boxlang boxlang backend/library-maintenance.bxs
```

El [informe A](docs/plan/evidence/phase02-platform-security.md) contiene operaciones/parámetros, límites, contrato para B/C y la secuencia HTTP completa con cuota concurrente, reinicio real y limpieza acotada. Ejecutar las migraciones antes de usar la biblioteca; originales de usuarios nunca se guardan en `backend/` ni se sirven como archivos públicos.
