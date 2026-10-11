# 02 — Usuarios y espacios

## Cuentas

- Registro libre mediante correo y contraseña.
- Inicio y cierre de sesión.
- Sin verificación del correo ni recuperación de contraseña por email en el prototipo.
- El correo declarado no acredita identidad; esta limitación debe mostrarse y documentarse.
- La demostración utilizará información sintética o autorizada para este entorno.

El prototipo se desplegará en un servidor privado para un grupo limitado. Antes de abrirlo a uso real o registro público, deben revisarse la validación de identidad y los controles excluidos de esta entrega.

## Espacios compartidos

- Cualquier usuario registrado puede crear un espacio.
- Un usuario puede pertenecer a varios espacios.
- La biblioteca, las consultas y el grafo pertenecen al espacio activo.
- Las consultas no combinan espacios, aunque el usuario tenga acceso a varios.
- El aislamiento debe abarcar originales, texto, vectores, conceptos, relaciones, tareas y citas.

## Roles

| Acción | Administrador | Editor | Lector |
|---|---:|---:|---:|
| Consultar documentos y usar el chat | Sí | Sí | Sí |
| Explorar el grafo y previsualizar documentos | Sí | Sí | Sí |
| Cargar, editar, actualizar y eliminar documentos del espacio | Sí | Sí | No |
| Gestionar miembros y roles | Sí | No | No |

El rol de administrador no concede acceso a conversaciones privadas de otros usuarios. La gestión de responsables debe evitar dejar un espacio sin administrador.

## Incorporación de miembros

El administrador introduce el correo de una cuenta y el rol que tendrá en el espacio.

| Situación | Comportamiento interno |
|---|---|
| La cuenta existe | Se incorpora al espacio con el rol indicado |
| La cuenta no existe | No se incorpora ni se guarda una invitación pendiente |

Ambas situaciones devuelven el mismo mensaje y estado: **«Solicitud procesada»**. No se afirma que se haya enviado un email, ya que no hay envío de correo.

Después de que una persona se registre, el administrador debe repetir la incorporación si la solicitud anterior no pudo asociarse a una cuenta.

La respuesta de esta operación no debe permitir enumerar cuentas. También deben protegerse registro e inicio de sesión frente a esa enumeración y a intentos abusivos.

## Conversaciones privadas y compartidas

- Cada conversación pertenece a su autor y a un espacio.
- Es privada por defecto.
- El autor puede compartirla con los miembros del espacio en modo lectura.
- Solo el autor puede continuar la conversación.
- El autor puede dejar de compartirla.
- No hay enlaces públicos ni colaboración de varios autores en esta entrega.
- Leer una conversación compartida requiere conservar acceso al espacio.
- Los cambios de membresía deben aplicarse también al historial y a las citas.
