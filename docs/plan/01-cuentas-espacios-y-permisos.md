# Fase 01 — Cuentas, espacios y permisos

**Estado:** En curso; implementación y pruebas locales aprobadas, revisión independiente de Sol pendiente. Fase 00 sigue Bloqueada por evidencia externa; el avance de fase 01 está autorizado expresamente y no cambia ese estado. [Índice](README.md).

**Fuente:** [usuarios y espacios](../specification/02-usuarios-y-espacios.md) y [seguridad](../specification/06-arquitectura-y-seguridad.md). **Cobertura:** V01–V03 y V15.

## Qué se debe lograr

Una persona puede registrarse, entrar, crear un espacio e incorporar cuentas existentes. BoxLang decide qué puede hacer cada usuario en cada espacio y aplica cambios de permisos inmediatamente. Cambiar IDs o enviar un rol desde el navegador nunca concede acceso.

## Flujo que debe funcionar

1. Ana se registra, inicia sesión y crea «Políticas»; queda como administradora.
2. Bruno y Carla se registran. Ana los incorpora como editor y lector.
3. Ana tiene otro espacio; cambiar el espacio activo no mezcla datos ni permisos.
4. Carla intenta una operación de gestión por API: BoxLang la rechaza aunque el frontend oculte el botón.
5. Ana retira a Bruno; su sesión puede seguir abierta, pero ya no accede al espacio.
6. Ana cierra sesión; la sesión anterior deja de autorizar peticiones.

## Backend BoxLang: tareas concretas

- [x] **01.1 — Persistencia.** Migración ejecutable versionada, normalización de correo a minúsculas, unicidad y una membresía por usuario/espacio; replay comprobado.
- [x] **01.2 — Registro.** Validación backend, PBKDF2-HMAC-SHA256 y respuesta genérica para registro duplicado; sin hashes/credenciales en respuestas.
- [x] **01.3 — Sesión.** Login/current/logout, expiración persistida, cookie según origen, Origin+CSRF en mutaciones y límites persistidos contra abuso.
- [x] **01.4 — Espacios.** Creación atómica con rol admin, listado propio y autorización efectiva al consultar detalle.
- [x] **01.5 — Miembros.** Incorporación genérica con mismo estado/mensaje, sin invitación ni estado pendiente y sin prometer email.
- [x] **01.6 — Roles.** Gestión admin-only, transacción/row lock y protección concurrente del último administrador.
- [x] **01.7 — Autorización común.** `AccountService.authorize` relee sesión/membresía efectiva y se usa para detalle, gestión y mutaciones de membresía.

## Operaciones mínimas del backend

Las rutas, métodos y nombres definitivos se documentan al implementar; esta tabla fija comportamiento, no presupone endpoints existentes.

| Operación | Autorización | Resultado |
|---|---|---|
| Registro/login | Pública dentro del entorno privado, limitada contra abuso | Sesión o respuesta segura sin enumeración |
| Sesión actual/logout | Sesión vigente según operación | Usuario permitido o invalidación efectiva |
| Crear/listar espacios | Usuario autenticado | Solo espacios del usuario; creación con administrador |
| Listar miembros | Administrador del espacio | Sin revelar cuentas ajenas al espacio |
| Incorporar/cambiar rol/retirar | Administrador del espacio | Cambio autorizado o rechazo; nunca cero administradores |

## Frontend Next.js: pantallas y comportamiento

- [x] Registro y login con validación útil, mensajes backend, estado de carga y prevención de envíos repetidos.
- [x] Selector vacío/creación; cambiar de espacio descarta contenido anterior y evita aplicar respuestas obsoletas.
- [x] Gestión de miembros/roles admin-only, confirmación de retirada y respuesta genérica.
- [x] Textos ES/EN, formularios/controles accesibles por teclado y advertencias de identidad/recuperación.
- [x] Expiración/revocación limpian contenido protegido al detectar la pérdida de acceso.

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio | Task 1 |
|---|---|---|---|
| P01.1 | Registrar, login, logout y reutilizar sesión vieja | Acceso válido antes del logout y rechazado después | Aprobada; incluye expiración en DB/API |
| P01.2 | Login incorrecto/cuenta ausente y registro repetido | Respuestas no enumeradoras; límites de intentos comprobados | Aprobada; contador persistido y límite 429 |
| P01.3 | Incorporar cuenta existente e inexistente | Mismo estado/mensaje; solo la existente obtiene membresía; sin invitación pendiente | Aprobada; HTTP 200 y `Solicitud procesada` |
| P01.4 | Probar administrador/editor/lector/ajeno en gestión | Solo administrador modifica membresías; ajeno no accede | Aprobada mediante API real |
| P01.5 | Retirar/demover al último administrador; repetir en concurrencia | Espacio conserva al menos un administrador | Aprobada, incluido `Promise.all` |
| P01.6 | Retirar membresía con sesión abierta y repetir petición | Rechazo inmediato en backend; frontend comunica pérdida de acceso | Aprobada por API y navegador aislado ES/EN |
| P01.7 | Manipular usuario, espacio o rol enviado por cliente | Sin ampliación de permisos ni acceso cruzado | Aprobada; incluye Origin, CSRF y payloads inválidos |

## Entregables y criterio de finalización

- [x] Migración ejecutable, operaciones documentadas y pantallas conectadas a BoxLang con persistencia real.
- [x] Comprobaciones de roles/sesiones con DB/API real y evidencia browser ES/EN, teclado, dos espacios y revocación.
- [x] P01.1–P01.7 pasan localmente. El informe Task 1 registra commit, comandos, entorno, resultados y límites; falta aprobación independiente antes de cambiar el estado de fase.

## Operaciones entregadas

Las rutas same-origin, métodos, estados, cookies y límites de seguridad se detallan en el [README](../../README.md). El migrador se ejecuta con `docker compose -p second-brain-phase01 exec boxlang boxlang backend/migrations/migrate.bxs`; reejecutarlo informa `Migration 1 already applied`. El servicio HTTP de BoxLang vive en `backend/api/account.bxm`; el transporte Next.js es allowlist fija y no contiene autorización de negocio.

Decisiones exactas: PBKDF2-HMAC-SHA256, 600.000 iteraciones, salt 16 bytes y output 32; sesión 32 bytes aleatorios, solo hash SHA-256 persistido, 12 horas; cookie HttpOnly/SameSite=Lax/Path=/, Secure para `APP_ORIGIN` HTTPS y excepción HTTP limitada a loopback; Origin exacto y CSRF para mutaciones; 10 intentos por correo en ventana persistida de 15 minutos. Sin email, recuperación, invitaciones ni llamadas de IA.

**No se incluye:** verificación/recuperación por email, registro público en internet ni acceso administrativo a chats privados. **Siguiente:** [fase 02](02-biblioteca-tareas-y-presupuesto.md).
