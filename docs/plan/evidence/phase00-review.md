# Revisión y entrega — fases 00 y 01

**Fecha:** 2026-10-11. **Revisor:** Sol (GPT-6.1), revisión del follow-up preexistente `b27ebffcdc9c0c1839ba8d137232f2d7d869f952` de `phase00-finish`, separado de su implementación original. **Base de la carpeta original:** `eea2a7dfcb53a5a9a192b1ae4bd9234072ad9c35`; entrega como cambios locales, sin commit, merge ni push.

**Veredicto:** APRUEBA el cierre de viabilidad de fase 00 y su integración en la carpeta original. I1/I2/M1/M2 quedan cerrados dentro del alcance de fase 00. La fase 01 conserva su aprobación previa y sus pruebas ejecutables pasan otra vez en este entorno. Ambas fases quedan **Verificadas**, no la aplicación completa.

## Revisión focalizada

- **I1:** se adopta el subset real de loaders/ZIP/XML con matriz por formato, coordenadas, dependencia/licencia y rechazos. Office universal, módulos premium, vistas de producto, grafo DB y despliegue no son prerrequisitos inventados de esta fase; permanecen en sus entregas posteriores.
- Se concretan además los defaults de descarga que necesita fase 05: conexión/total 10/30 s, tres redirecciones, 50 MB/respuesta y 100 MB/operación descomprimidos, rechazo sin truncar y validación por salto. No se implementa red/SSRF en fase 00.
- **I2:** navegador original `http://127.0.0.1:3000/feasibility` abre el asset PDF original, página 2/2; marca la cita dentro del text layer y conserva alineación canvas/text layer. Markdown renderizado marca solo la segunda frase repetida mediante offsets del AST; no ejecuta HTML/código ni carga enlaces/imágenes.
- **M1:** regresión rechaza la imagen original (`0.000001` se leía como `1`), pasa con la imagen parcheada y usa igualdad exacta contra PostgreSQL. Solo entrada→float32 tiene tolerancia relativa; no acepta un cero en lugar de `1e-6`.
- **M2:** la regresión afirma IDs, metadatos y las 1.536 coordenadas de ambas lecturas. Ciclo y preservación se atribuyen a `tests/probe.bxs`; soporte científico, a la ejecución, no a texto inexistente de la documentación.
- Se inspeccionó el parser y todos sus callers de lectura en bx-ai instalado: corrección compartida, no workaround por endpoint. `storeDocument` real pasa, sin bypass de inserción SQL. Dockerfile, dependencias/lockfile, wiring y CSS coinciden con el follow-up; los dos componentes solo añaden comentarios `ponytail:` sobre sus límites.

## Entorno observado

Compose **`second-brain`**, puertos loopback 3000/8080/55433, volumen existente conservado. Tres servicios healthy tras `docker compose up -d --build --wait`. BoxLang `1.18.0+66`, bx-ai `3.5.0+19`, bx-postgresql `1.2.0+4`, PostgreSQL `17.11`, pgvector `0.8.7`, Node `24.21.0`, Next `16.4.0`, React `19.3.0`, React-PDF `10.1.0`, PDF.js `5.3.93`, react-markdown `10.1.0`.

## Comandos y resultados nuevos

| Comando | Resultado |
|---|---|
| `docker compose up -d --build --wait` | Exit 0; instalación frontend con lockfile congelado, parche backend aplicado en imagen; servicios healthy |
| `docker compose exec -T boxlang boxlang tests/smoke.bxs` | OK: módulo, BoxLang AI, PostgreSQL/pgvector disponibles |
| `docker compose exec -T boxlang boxlang tests/vector-roundtrip.bxs` | OK: store/getById/findSimilar preservan 1.536 dimensiones, signos, exponentes ± y ceros; imagen original falló antes del rebuild |
| `docker compose exec -T boxlang boxlang tests/probe.bxs` | OK: B cercano excluido, filtros previos al ranking, selección múltiple/vacía, top-k/dedupe, reemplazo/borrado y hermanos intactos |
| `docker compose exec -T frontend node --input-type=module < tests/http.mjs` | OK: health BoxLang, rechazo POST, conexión Next.js→BoxLang |
| `docker compose exec -T frontend pnpm lint` | Exit 0 |
| `docker compose exec -T frontend pnpm exec tsc --noEmit` | Exit 0 |
| `docker compose run --rm --no-deps -v "$PWD:/repo:ro" -w /repo frontend node tests/viewer-fixtures.mjs` | OK: hashes de assets/originales, cita Markdown repetida y página PDF 2 |
| `docker compose exec -T frontend node /tests/contracts.mjs` | OK: ocho hashes/coordenadas, rangos/export obsoleto, negativos JSON/CSV y 20 casos congelados |
| `docker compose exec -T boxlang boxlang backend/migrations/migrate.bxs` | `Migration 1 already applied` |
| `docker compose exec -T boxlang boxlang tests/phase01-crypto.bxs` | OK: PBKDF2/600.000, salt/output, comparación constante y tokens |
| `docker compose exec -T -e P01_RUN=finish-20261011-1849 boxlang boxlang tests/phase01-expiry.bxs` | OK: expiración DB rechaza sesión y limpia cookie |
| `docker compose exec -T -e P01_RUN=finish-20261011-1849 -e BOXLANG_URL=http://boxlang:8080 -e P01_FRONTEND_URL=http://127.0.0.1:3000 -e P01_ORIGIN=http://127.0.0.1:3000 frontend node --input-type=module < tests/phase01-http.mjs` | OK P01.1–P01.7: sesiones, no enumeración, rate limit, roles/aislamiento, carrera último admin, revocación, Origin/CSRF y manipulación |
| `docker compose exec -T -e P01_RUN=finish-20261011-1849 boxlang boxlang tests/phase01-audit.bxs` | OK: migración única, sin invitaciones, parámetros PBKDF2, contador persistido y solo hash de sesión |
| `docker compose exec -T -e P01_RUN=finish-20261011-1849 boxlang boxlang tests/phase01-cleanup.bxs` | OK: eliminadas solo cuentas/datos sintéticos del slug |
| `git diff --check` | Exit 0 |

Lectura de versiones: `boxlang --version`, manifests de módulos instalados, `pnpm list --depth 0`, consultas PostgreSQL `version()`/`pg_extension`. La primera introspección Node por `require('react-markdown/package.json')` falló por exports del paquete; `pnpm list` confirmó la versión. No fue un fallo de aplicación.

## Comprobaciones de navegador

- Markdown: status `línea 3, offsets 1–13`; un `<mark>` con `repeat phrase`, primera ocurrencia anterior sin marcar. En el scope de seguridad: scripts/imágenes/anchors **0**, ejecución de indicadores **false**, sin request a `invalid.example`.
- PDF: request a `/phase00/locations.pdf`; página **2/2**, offsets **1–49**, texto `For urgent purchases, attach prior authorization.` marcado dentro de `.textLayer`; canvas y text layer **493 px** de ancho, misma superficie.
- Teclado: foco en selector PDF + `ArrowUp` selecciona CSV; `Home` vuelve a Markdown. Foco en `<summary>` + `Enter` abre la prueba negativa.
- Grafo: `Enter` sobre `Expandir policy` y `Expandir limits` produce ocho nodos únicos; se muestra `8/8 nodos visibles · límite alcanzado` y otra expansión queda deshabilitada.
- No se repitió la suite de navegador de cuentas ES/EN: sus componentes no cambiaron; se conserva su evidencia previa. Sí se repitieron todas las pruebas ejecutables de fase 01 anteriores.

## Gate de fase 00 y límites

| Gate | Cierre |
|---|---|
| P00.1 | PASS: build, smoke y HTTP en carpeta original |
| P00.2 | PASS según evidencia real previa aceptada: ambos modelos, uso/configuración/coste; sin nuevas llamadas |
| P00.3 | PASS: dimensión/roundtrip previo real + regresión científica actual y filtros antes del ranking |
| P00.4 | PASS: reemplazo/borrado y conservación de hermanos/espacio B |
| P00.5 | PASS de viabilidad acotada: coordenadas de ocho formatos, extracción previa aceptada y mecanismos PDF/Markdown comprobados |
| P00.6 | PASS: decisiones/contratos/límites completos y I1/I2/M1/M2 cerrados; no capacidad crítica asumida como producto final |

No hay llamadas nuevas ni gasto IA en esta revisión/integración; acumulado histórico sigue en **USD 0.00001866 estimados**. No se afirma inspección nueva del log externo ni facturación. No se repiten extracción/security sin cambios, no se instala runtime global, no se modifican `.env`, documentos privados ni otros proyectos/volúmenes. La fase 00 no acredita parsers universales, RAG, la evaluación semántica final, rendimiento, TLS desplegado o backup restaurado: esos trabajos siguen pendientes en las fases correspondientes.
