# Task 1 — Fase 01, cuentas, espacios y permisos

Fecha: 11 de octubre de 2026  
Rama: `phase01-accounts`  
Base: `156a39095c90bf315a380a003479c6ae71409344`  
Commit de implementación: `20164ccaead701bb256a4b67a310461c3c978ce3` (`feat: implement phase 01 accounts and spaces`)  
Estado: **En curso**, pendiente de revisión independiente de Sol.

## Resultado

Fase 01 implementada con PostgreSQL y BoxLang reales para cuentas, sesiones, espacios, membresías y autorización. Next.js presenta la interfaz bilingüe y delega exclusivamente a una allowlist same-origin. Las pruebas locales P01.1–P01.7 y las comprobaciones de navegador descritas abajo pasaron. No hubo llamadas de IA.

La fase 00 permanece **Bloqueada**: Sol aprobó la última fix wave local G1/G2/G3, pero siguen sin verificarse proveedores/modelos reales, tarifas/uso/coste y condiciones externas de operación. Avanzar en fase 01 fue autorizado de forma expresa y no cambia aquel estado.

## Cambios incluidos

- `backend/migrations/001_accounts.sql`, `backend/migrations/migrate.bxs`: migración versionada y ejecutable para cuentas, espacios, membresías, sesiones y límites persistidos; claves foráneas/índices y unicidad de membresía.
- `backend/secondBrain/AccountService.bx`: lógica Pure BoxLang de autenticación, credenciales, límites, sesiones, espacios, miembros y autorización viva. Serializa cambios de membresía y protege al último administrador.
- `backend/api/account.bxm`: único despacho HTTP BoxLang; valida tamaño/formato, cookie y payload, y normaliza errores sin filtrar detalles internos.
- `frontend/app/api/[...path]/route.ts`: delegación same-origin mediante operaciones/rutas permitidas; sin reglas de negocio ni autorización en Next.js.
- `frontend/app/components/`: componentes separados de autenticación, espacios, miembros y estado raíz. Incluye idiomas ES/EN, formularios accesibles, teclado, confirmación de acciones y limpieza de datos al expirar/revocar acceso.
- `frontend/app/feasibility/page.tsx`: conserva las comprobaciones deterministas de fase 00 en ruta de desarrollo.
- `tests/phase01-{http,expiry,crypto,audit,cleanup}.*`: comprobaciones ejecutables con `node:assert` y BoxLang, incluyendo API/DB real, carrera concurrente y limpieza limitada a slugs sintéticos.
- `README.md`, `docs/plan/README.md`, `docs/plan/00-viabilidad-y-decisiones.md`, `docs/plan/01-cuentas-espacios-y-permisos.md`, `docs/plan/verificacion.md`: instrucciones, contrato implementado y estados de seguimiento sincronizados.
- `compose.yaml`: `APP_ORIGIN` configurado para el origen local de esta instancia y configurable para TLS.

No se añadieron dependencias npm ni módulos BoxLang; se mantuvieron `DESIGN.md` y los planes 02–09 fuera del commit.

## Decisiones de seguridad y contrato

- Correo: trim + minúsculas, máximo 254 caracteres. Contraseña: 12–128 caracteres.
- Hash: Java `PBKDF2WithHmacSHA256`, **600.000** iteraciones, salt aleatorio de **16 bytes**, salida de **32 bytes** y comparación `MessageDigest.isEqual`.
- Sesión: **32 bytes aleatorios** codificados base64url; PostgreSQL almacena exclusivamente SHA-256 del token. Expiración persistida: **12 horas**. El bearer no aparece en JSON, almacenamiento local ni URL; el CSRF es independiente.
- Cookie: `HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`; `Secure` si `APP_ORIGIN` usa HTTPS. HTTP se acepta solo para `localhost`/`127.0.0.1`. `Origin` debe igualar exactamente `APP_ORIGIN`; login/registro validan Origin y todas las mutaciones autenticadas requieren Origin y CSRF.
- Límite de registro/login: **10 intentos por correo en una ventana fija de 15 minutos**, persistidos en PostgreSQL. El límite es por identidad, no por IP; no se confían cabeceras de IP reenviadas sin contrato de proxy confiable.
- Roles: `admin`, `editor`, `reader`. Lectura para miembros; admin/editor quedan autorizados para futuras escrituras documentales; solo admin gestiona miembros. No se implementan documentos ni chats.
- Incorporar correo existente/no existente devuelve HTTP `200` y exactamente `Solicitud procesada`; no crea invitaciones ni altera un rol existente por `ON CONFLICT`.
- `AccountService.authorize` relee sesión y membresía actuales. Las mutaciones bloquean la fila del espacio dentro de transacción antes de volver a autorizar y contar administradores; una incorporación existente no puede degradar membresías.
- Rutas same-origin documentadas en `README.md`: registro/login/current/logout; listar/crear espacios; detalle; listar/incorporar miembros; cambiar rol/retirar miembro. El transporte solo traduce ruta+método a una operación BoxLang permitida.

## Verificación

### Entorno

Compose aislado `second-brain-phase01`, servicios healthy en `127.0.0.1:3002`, `:8082` y `:55435`. Versiones observadas o fijadas: BoxLang **1.18.0+66**, Next.js **16.4.0**, React **19.3.0**, Node.js **24.21.0**, PostgreSQL **17.11**, pgvector **0.8.7**, `bx-ai` **3.5.0** y `bx-postgresql` **1.2.0**. No se imprimió ni añadió `.env`/credencial al repositorio.

### Comandos y resultados

Todas las comprobaciones se ejecutaron dentro de Docker Compose salvo la aserción Node dirigida al puerto local del contenedor temporal Secure. Las llamadas usaron direcciones `example.invalid` y contraseñas sintéticas.

```text
docker compose -p second-brain-phase01 exec boxlang boxlang backend/migrations/migrate.bxs
Migration 1 already applied
```

Se repitió el comando: volvió a indicar `Migration 1 already applied` sin duplicar la fila de versión.

```text
docker compose -p second-brain-phase01 exec boxlang boxlang tests/smoke.bxs
OK: Second Brain, BoxLang AI, PostgreSQL y pgvector disponibles.

docker compose -p second-brain-phase01 exec boxlang boxlang tests/phase01-crypto.bxs
OK: PBKDF2-HMAC-SHA256/600000, 16-byte SecureRandom salt, 32-byte output, MessageDigest.isEqual, 32-byte base64url token

docker compose -p second-brain-phase01 exec -e P01_RUN=phase01-20261011-c boxlang boxlang tests/phase01-expiry.bxs
OK P01.1: real DB expiry denies the next current-session request and clears the cookie.
```

Suite HTTP real contra BoxLang, Next.js y PostgreSQL (`P01_RUN=phase01-20261011-c`):

```text
P01 HTTP run: phase01-20261011-c
OK P01 HTTP: proxy/cookie/session/logout, generic registration/login, persisted rate limit, space isolation, role matrix, same incorporation result, last-admin race, revocation, CSRF/Origin and manipulated-input rejection.

docker compose -p second-brain-phase01 exec -e P01_RUN=phase01-20261011-c boxlang boxlang tests/phase01-audit.bxs
OK P01 audit: unique migration row, no invitation model, PBKDF2 parameters persisted, bounded database rate counter, hashed-only session column.
```

La suite Node se ejecutó con `BOXLANG_URL=http://boxlang:8080`, `P01_FRONTEND_URL=http://127.0.0.1:3000` desde el contenedor frontend y `P01_ORIGIN=http://127.0.0.1:3002`. La auditoría confirmó migración única, ausencia de tabla/modelo de invitaciones, parámetros PBKDF2 persistidos, contador acotado y solo hash de sesión.

Cookie HTTPS: se levantó un BoxLang efímero en el puerto local 8083 con `APP_ORIGIN=https://second-brain.invalid`, se registró e inició sesión enviando ese Origin y se verificó `Set-Cookie`; se retiró ese contenedor al finalizar. Resultado:

```text
OK HTTPS APP_ORIGIN: login cookie includes Secure, HttpOnly and SameSite=Lax.
```

Calidad frontend en el contenedor: `pnpm lint` (ESLint sin findings), `pnpm exec tsc --noEmit` (exit 0 sin salida) y `pnpm build` en un contenedor Compose efímero (Next.js 16.4.0; build, TypeScript y generación de rutas completados). El build temporal no alteró el servidor dev activo.

### Resultados P01.1–P01.7

| Prueba | Resultado local |
|---|---|
| P01.1 | Registro/login/current/logout; cookie expirada/reutilizada denegada; logout invalida sesión. Expiración real en DB/API deniega current y expira la cookie. |
| P01.2 | Registro duplicado y login ausente/incorrecto no enumeran; JSON inválido rechazado; límites persistidos y solicitud 11 rechazada con `429`. |
| P01.3 | Incorporación existente e inexistente: ambos `200` y mismo mensaje; solo cuenta existente obtiene membresía; no hay tabla/invitación. En UI el mensaje genérico se muestra y cambia de idioma correctamente. |
| P01.4 | Admin/editor/reader/ajeno: aislamiento entre espacios y gestión admin-only, incluidos intentos directos por API. |
| P01.5 | Democión/retirada del único admin responde `409`; carrera HTTP `Promise.all` deja al menos un administrador. Incorporación/upsert conserva rol existente. |
| P01.6 | Al retirar a Bruno, el siguiente detalle de API da `403` y la sesión de cuenta sigue vigente. En navegador, al pulsar «Actualizar acceso», Bruno pierde el espacio y el contenido protegido desaparece. |
| P01.7 | IDs/roles/userId manipulados no elevan permisos; CSRF ausente/incorrecto, Origin ausente/ajeno, payload inválido y body excesivo se rechazan. |

### Evidencia de navegador

Chrome DevTools, frontend `http://127.0.0.1:3002`, contextos aislados `phase01-ana` y `phase01-bruno`:

1. Ana se registró e inició sesión; creó «Políticas» y «Investigación» usando Enter, con rol admin y selección activa. Alternó entre ambos; no se mezcló contenido. Cambió a inglés y comprobó controles y textos traducidos.
2. Bruno se registró/inició sesión en contexto aislado. Ana lo incorporó como editor en «Políticas»; tras recargar, Bruno vio solo ese espacio con rol Editor. Ana retiró la membresía mediante la confirmación. En el contexto de Bruno, «Actualizar acceso» dejó la lista en `00`, seleccionó el estado vacío y retiró el contenido protegido. La sesión de Bruno continuó utilizable hasta su logout.
3. Bruno y Ana usaron «Cerrar sesión»/«Sign out» y volvieron a la pantalla de acceso.
4. Tras la auto-revisión, se comprobó por teclado Enter la incorporación inexistente: el estado accesible visible fue exactamente `Solicitud procesada` en español y `Request processed` en inglés; al alternar idioma, el aviso existente también cambió de idioma. El estado de creación de espacio «Espacio creado.» se actualizó a «Space created.» al alternar.

El flujo de revocación se probó antes de la corrección de persistencia/traducción de avisos; los cambios posteriores solo cambiaron las claves de presentación. El aviso genérico se volvió a probar en ES/EN después de esa corrección.

### Limpieza sintética

`tests/phase01-cleanup.bxs` eliminó exclusivamente los slugs conocidos `phase01-20261011-a`, `phase01-20261011-b`, `phase01-20261011-c`, `phase01-20261011-d` y `phase01-secure-01`; cada ejecución confirmó que eliminó cuentas P01 y sus sesiones/espacios/membresías/límites dependientes. `phase01-expiry.bxs` elimina su cuenta de prueba en `finally`. No se truncaron tablas ni se borraron cuentas ajenas a esos slugs.

## Auto-revisión y límites

La lectura de `AccountService.bx`, transporte BoxLang/Next.js, autorización, componentes UI y callers confirmó: parámetros SQL enlazados; el cliente no elige userId/rol de creación; sesión no se expone; reautorización central; no existe tabla de invitaciones; la pantalla no promete correo. La auto-revisión encontró que la gestión desmontaba su panel al refrescar, ocultando el mensaje local de éxito. Se corrigió elevando el aviso al padre y conservando claves de traducción, y se verificó en ambos idiomas.

Límites deliberados: el throttle es por correo y no bloquea un spray distribuido entre identidades; producción necesitará un límite en el borde con una identidad IP confiable. No se verificó un proxy TLS/dominio productivo: solo se comprobó que `APP_ORIGIN` HTTPS produce el atributo `Secure`. Registro no verifica identidad y no incluye recuperación de contraseña por email. No se realizaron llamadas, pruebas de coste ni comprobaciones externas de IA.

Fase 01 no se marca Verificada ni completa: queda **En curso** hasta la revisión independiente de Sol. No hubo push, merge, apagado de servicios ni cambios a los documentos de fases 02–09 o `DESIGN.md`.

Este informe se incorpora en un commit posterior, solo documental; su hash se devuelve con el commit de implementación.

## Ronda 1 — R1 (2026-10-11)

Sol confirmó R1 P2: `createSpace` no procesaba `401` mediante `handleSessionExpiry`, a diferencia de los demás flujos protegidos. Se corrigió en el caller compartido `SecondBrainApp.tsx`: el `catch` limpia el estado protegido y después vuelve a lanzar el error para que `WorkspacePanel` presente el aviso de sesión expirada. No se modificó el backend ni el manejo de errores de los demás callers.

Comprobación focalizada real en Chrome DevTools (`http://127.0.0.1:3002`): cuenta/espacio sintéticos; logout HTTP `200` desde otra pestaña; después, submit «Crear espacio» en la pestaña que conservaba el panel. `POST /api/spaces` devolvió `401` y expiró la cookie; inmediatamente desaparecieron espacios, panel y miembros, y quedó visible el formulario de inicio de sesión con «Tu sesión caducó. Inicia sesión de nuevo.». La petición «Must not create» no creó espacio. Se eliminó la única cuenta sintética con `P01_RUN=sol-review-20261011` mediante `tests/phase01-cleanup.bxs`.

Comprobaciones de esta ronda: `docker compose -p second-brain-phase01 exec frontend pnpm exec tsc --noEmit` (exit 0); `docker compose -p second-brain-phase01 config -q` (exit 0); `git diff --check` (exit 0). No se repitieron lint, build ni P01.1–P01.7.

Wiring opcional de proveedor: `OPENAI_API_KEY` se expone únicamente al servicio BoxLang; llamadas deshabilitadas por defecto y el script existente requiere el opt-in `P00_ALLOW_PROVIDER_CALLS=YES`, fecha/fuente/tarifas explícitas y límite de USD 1. README documenta la configuración local. La documentación oficial consultada lista `gpt-6-luna`, `text-embedding-3-small` y tarifas Standard (revisadas el 2026-10-11); se registraron en `.env.example` junto con fecha y URL de referencia, no como garantía de tarifa futura. No se hicieron llamadas: la clave no está configurada ni en el `.env` privado del worktree ni en el proceso BoxLang. La verificación de documentación no comprueba permisos, facturación o cuota de esta cuenta; validar esos puntos requiere la clave y el opt-in explícito del usuario. No se usó clave sentinel ni se imprimió secreto alguno.

Fase 00 sigue **Bloqueada** por evidencia externa. Esta corrección no marca fase 01 como verificada: permanece **En curso** a la espera de la siguiente revisión independiente de Sol. `DESIGN.md` y planes 02–09 permanecen intactos; sin push, merge ni apagado de servicios.
