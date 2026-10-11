# Evidencia del probe de proveedor — fase 00

Fecha: 2026-10-11. Entorno aislado `second-brain-phase01`; revisión de base `46d9cd3`. bx-ai `3.5.0`, BoxLang `1.18.0`, PostgreSQL/pgvector Compose. Entrada sintética; sin documentos privados ni credenciales en este registro.

## Preflight

- Referencia oficial Standard consultada el 2026-10-11: [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [precios](https://developers.openai.com/api/docs/pricing), [embeddings](https://developers.openai.com/api/docs/guides/embeddings).
- bx-ai instalado: `OpenAIService` apunta a `/v1/chat/completions` y `/v1/embeddings`, y combina parámetros de solicitud en el packet. El modelo documenta Chat Completions; embeddings usan el modelo `text-embedding-3-small`.
- Modelo chat solicitado/observado: `gpt-6-luna`; embedding solicitado/observado: `text-embedding-3-small`. Tarifas Standard usadas: USD 0.10/M entrada + USD 0.50/M salida; USD 0.02/M embedding. Fecha/referencia pasan al registro.
- `P00_ALLOW_PROVIDER_CALLS` siguió `NO` en el contenedor; `YES` se pasó solo a cada ejecución de `exec`. Timeout 30 s, cero retries, salida máxima chat 32 tokens, `reasoning_effort=none`. Techo total USD 1. Estimación conservadora por ejecución: USD 0.00002368; dos ejecuciones como máximo estimado USD 0.00004736, muy por debajo del techo.
- Registro NDJSON temporal único por ejecución en `/tmp` del contenedor. El script registra resumen/uso, no el vector; no se guardó ni imprimió la clave.

Comandos de preflight/ejecución: Compose `config --format json | jq -r '.services.boxlang.environment.APP_ORIGIN'` (solo imprime ese campo); recreación `FRONTEND_PORT=3002 BACKEND_PORT=8082 POSTGRES_PORT=55435 ... docker compose -p second-brain-phase01 up -d --no-deps --force-recreate boxlang`; luego dos ejecuciones explícitas `docker compose -p second-brain-phase01 exec -T -e P00_ALLOW_PROVIDER_CALLS=YES -e P00_PROVIDER_RECORD_PATH=<ruta-única-en-/tmp> boxlang boxlang tests/provider.bxs`. Preflight confirmó clave presente sin mostrarla, `P00_ALLOW_PROVIDER_CALLS=NO` en servicio, origen `http://127.0.0.1:3002`, endpoints del bx-ai instalado, cero retries y presupuesto calculado.

## Resultados observados

| Ejecución | Solicitudes API | Operación / endpoint | Uso observado | Coste calculado |
|---|---:|---|---|---:|
| 1 | 1 | Chat `/v1/chat/completions`; validación exacta de respuesta correcta | 16 prompt + 9 completion = 25 tokens; `finish_reason=stop` | USD 0.00000610 |
| 1 | 1 | Embedding `/v1/embeddings`; respuesta validada | 6 tokens; 1,536 dimensiones | USD 0.00000012 |
| 2 | 1 | Chat `/v1/chat/completions`; validación exacta de respuesta correcta | 16 prompt + 9 completion = 25 tokens; `finish_reason=stop` | USD 0.00000610 |
| 2 | 1 | Embedding `/v1/embeddings`; respuesta validada | 6 tokens; 1,536 dimensiones | USD 0.00000012 |

Total observado: 4 llamadas, 50 tokens de chat, 12 tokens de embedding; coste por tarifas declaradas USD **0.00001244**. Es una estimación basada en uso reportado, no un extracto de facturación de la cuenta.

## Roundtrip pgvector

Falló en ambas ejecuciones después de las dos respuestas de proveedor válidas. La segunda ejecución elevó temporalmente la tolerancia de `1e-6` a `1e-5`; aun así detectó diferencia absoluta **6.57432625607681274414** en la dimensión **92**. El umbral final se dejó en `1e-6`; el resultado no aprueba preservación/inserción-recuperación, no se atribuye a precisión de redondeo y no declara pgvector compatible. Error registrado: `Provider vector pgvector roundtrip error at dimension 92: 6.57432625607681274414`. No se reintentó automáticamente ni se hicieron más llamadas.

Conclusión acotada: acceso real, endpoint, respuesta útil, uso/coste calculable y dimensión del embedding quedan observados; el roundtrip requiere diagnóstico local antes de aceptar compatibilidad. No acredita recuperación aislada, ciclo reemplazo/borrado, loader, operación, hostname, TLS ni facturación. Fase 00 permanece **Bloqueada**; P00.9 sigue pendiente por hostname/TLS/condiciones externas.
