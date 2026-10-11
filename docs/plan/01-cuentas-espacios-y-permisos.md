# Fase 01 — Cuentas, espacios y permisos

**Estado:** Pendiente. **Dependencia:** [fase 00](00-viabilidad-y-decisiones.md) verificada. [Índice](README.md).

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

- [ ] **01.1 — Persistencia.** Migraciones versionadas para cuentas, espacios, membresías y sesiones según la decisión de fase 00. Unicidad de correo con normalización definida y una membresía por usuario/espacio. Reejecutar migraciones no duplica datos.
- [ ] **01.2 — Registro.** Validar correo y contraseña en backend, proteger contraseña mediante un algoritmo apropiado verificado y nunca devolver hash/credenciales. Definir respuesta no enumeradora para un correo ya registrado.
- [ ] **01.3 — Sesión.** Implementar login, usuario/sesión actual y logout. Configurar expiración, cookie segura para el entorno y protección de operaciones mutables según el transporte elegido; mensajes genéricos y límites de abuso.
- [ ] **01.4 — Espacios.** Crear espacio con membresía administradora consistente; listar solo los propios. Verificar membresía al consultar un espacio aunque el usuario pertenezca a otros.
- [ ] **01.5 — Miembros.** Incorporar por correo/rol si la cuenta existe. Si no existe, no guardar invitación; ambas situaciones devuelven igual estado y «Solicitud procesada». La pantalla no puede prometer envío de email.
- [ ] **01.6 — Roles.** Cambiar rol/retirar miembro solo como administrador. Proteger al último administrador, incluso con dos cambios concurrentes.
- [ ] **01.7 — Autorización común.** Centralizar la comprobación existente o mínima que usarán documentos, chats, citas, tareas y grafo. Releer la autorización efectiva en peticiones posteriores a un cambio; no conservar un rol obsoleto como autoridad.

## Operaciones mínimas del backend

Las rutas, métodos y nombres definitivos se documentan al implementar; esta tabla fija comportamiento, no presupone endpoints existentes.

| Operación | Autorización | Resultado |
|---|---|---|
| Registro/login | Pública dentro del entorno privado, limitada contra abuso | Sesión o respuesta segura sin enumeración |
| Sesión actual/logout | Sesión vigente según operación | Usuario permitido o invalidación efectiva |
| Crear/listar espacios | Usuario autenticado | Solo espacios del usuario; creación con administrador |
| Listar miembros | Regla de lectura definida en el contrato de fase 00 | Sin revelar cuentas ajenas al espacio |
| Incorporar/cambiar rol/retirar | Administrador del espacio | Cambio autorizado o rechazo; nunca cero administradores |

## Frontend Next.js: pantallas y comportamiento

- [ ] Registro y login con validación útil, mensajes de backend, carga y prevención de envíos repetidos; no implementar otra política de seguridad en Next.js.
- [ ] Selector de espacio con estado vacío y creación. El cambio de espacio descarta el estado visual del anterior y evita mostrar respuestas tardías de ese espacio.
- [ ] Gestión de miembros/roles para administradores con confirmación de cambios destructivos y respuesta genérica de incorporación.
- [ ] Textos ES/EN y navegación por teclado; advertir que el correo declarado no verifica identidad y que no hay recuperación por email.
- [ ] Manejar sesión expirada y acceso retirado sin dejar contenido protegido visible tras detectar el cambio.

## Pruebas de cierre

| Prueba | Acción | Resultado obligatorio |
|---|---|---|
| P01.1 | Registrar, login, logout y reutilizar sesión vieja | Acceso válido antes del logout y rechazado después |
| P01.2 | Login incorrecto/cuenta ausente y registro repetido | Respuestas no enumeradoras; límites de intentos comprobados |
| P01.3 | Incorporar cuenta existente e inexistente | Mismo estado/mensaje; solo la existente obtiene membresía; sin invitación pendiente |
| P01.4 | Probar administrador/editor/lector/ajeno en gestión | Solo administrador modifica membresías; ajeno no accede |
| P01.5 | Retirar/demover al último administrador; repetir en concurrencia | Espacio conserva al menos un administrador |
| P01.6 | Retirar membresía con sesión abierta y repetir petición | Rechazo inmediato en backend; frontend comunica pérdida de acceso |
| P01.7 | Manipular usuario, espacio o rol enviado por cliente | Sin ampliación de permisos ni acceso cruzado |

## Entregables y criterio de finalización

- [ ] Migraciones ejecutables, operaciones documentadas y pantallas conectadas a BoxLang con persistencia real.
- [ ] Comprobaciones ejecutables de roles/sesiones y datos sintéticos de dos espacios; evidencia de navegador ES/EN.
- [ ] P01.1–P01.7 aprobadas y registro de cierre añadido; repetir autorizaciones al incorporar recursos futuros.

**No se incluye:** verificación/recuperación por email, registro público en internet ni acceso administrativo a chats privados. **Siguiente:** [fase 02](02-biblioteca-tareas-y-presupuesto.md).
