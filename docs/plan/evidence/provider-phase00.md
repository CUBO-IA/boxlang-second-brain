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

Falló en ambas ejecuciones después de las dos respuestas de proveedor válidas. La segunda ejecución elevó temporalmente la tolerancia de `1e-6` a `1e-5`; aun así detectó diferencia absoluta **6.57432625607681274414** en la dimensión **92**. Diagnóstico local posterior (sin proveedor) confirma causa en la lectura de bx-ai, no en el almacenamiento pgvector: el módulo instalado `bx-ai 3.5.0`, `PostgresVectorMemory.bx:637-642`, convierte el texto recuperado con `val(target)`. `val("1e-6")` produce `1` en BoxLang. Una búsqueda local con el vector sintético de 1.536 dimensiones devolvió el ID correcto y score `1`, pero la primera coordenada recibida por `findSimilar` fue `1` frente a `0.000001` tanto en entrada como en PostgreSQL. El umbral previo no aprobaba el roundtrip; esta causa concreta sí queda reproducida.

### Diagnóstico local reproducible (sin llamadas IA)

En el contenedor `boxlang` de Compose aislado, se generó un nombre de tabla aleatorio `p00_diag_<uuid>`, se configuró `PostgresVectorMemory` con 1.536 dimensiones y se construyó un vector de ceros con `[1]=1e-6`, `[2]=1`. Se insertó una única fila sintética mediante `queryExecute` parametrizado para aislar la lectura; el `storeDocument` del módulo no pudo completar la inserción en este ensayo (`Named parameter [:text] not provided to query`). `findSimilar(vector, 1, {})` se ejecutó mediante bx-ai. Se consultó la representación canónica de DB con `SELECT CAST(embedding AS text) ...`, se pasó a `jsonDeserialize` y se eliminó la tabla aleatoria en `finally`.

Contenido del script ad-hoc temporal ejecutado como `docker compose -p second-brain-phase01 exec -T boxlang boxlang /tmp/phase00-roundtrip.bxs` (el archivo fue eliminado al terminar):

```boxlang
table = "p00_diag_" & lCase(replace(createUUID(), "-", "", "all"));
memory = new bxModules.bxai.models.memory.vector.PostgresVectorMemory(collection=table);
vector = []; for (i=1; i<=1536; i++) vector.append(0); vector[1]=1e-6; vector[2]=1;
vectorText = "[" & vector.toList() & "]";
result = {dimensions=vector.len(), inputScientific=vector[1], inputValScientific=val("1e-6")};
try {
  memory.configure({datasource="secondBrain",table=table,collection=table,dimensions=1536,distanceFunction="COSINE",indexType="HNSW"});
  queryExecute("INSERT INTO #table# (id,text,embedding,collection) VALUES (:id,:docText,CAST(:embedding AS vector),:collection)", {id="diagonly",docText="synthetic local parse diagnostic",embedding=vectorText,collection=table}, {datasource="secondBrain"});
  found = memory.findSimilar(vector,1,{});
  db = queryExecute("SELECT CAST(embedding AS text) AS vector_text FROM #table# WHERE id = :id", {id="diagonly"}, {datasource="secondBrain",returntype="array"});
  dbVector = jsonDeserialize(db[1].vector_text);
  result.resultCount=found.len(); result.resultId=found[1].id;
  result.inputFirst=vector[1]; result.databaseFirst=dbVector[1]; result.findSimilarFirst=found[1].embedding[1];
  result.exactVectorStorage=dbVector.equals(vector); result.similarityScore=found[1].score;
  result.ok=found.len()==1 && found[1].id=="diagonly" && result.exactVectorStorage;
  println(jsonSerialize(result));
} finally {
  queryExecute("DROP TABLE IF EXISTS #table#", {}, {datasource="secondBrain"});
}
```

Salida sanitizada:

```json
{"findSimilarFirst":1,"resultId":"diagonly","inputValScientific":1,"databaseFirst":0.000001,"exactVectorStorage":true,"ok":true,"resultCount":1,"inputFirst":0.000001,"similarityScore":1,"dimensions":1536}
```

Conclusión acotada: el valor almacenado en PostgreSQL coincide exactamente con la entrada; pgvector devuelve la fila correcta y el ranking local de auto-búsqueda queda primero. La corrupción observada está al convertir la cadena científica a `embedding` de salida de `findSimilar` (`val("1e-6") → 1`), no prueba una falla de almacenamiento ni de ranking. No se modificó bx-ai, no se añadió adaptador y no hubo llamadas adicionales de IA. El método `storeDocument` no quedó validado por este diagnóstico local debido al error de binding indicado; el probe previo y sus resultados/coste no cambian.

Conclusión acotada: acceso real, endpoint, respuesta útil, uso/coste calculable y dimensión del embedding quedan observados. La escritura del vector sintético en DB conserva sus valores; la lectura pública de `findSimilar` queda limitada por el parser científico de bx-ai (residuo conocido). Coste del probe sin cambios: USD **0.00001244**.

**Bookkeeping posterior (2026-10-11):** la fase 00 se cerró como **Verificada** en [phase00-closure.md](phase00-closure.md). El residuo de `findSimilar` y la operación externa (hostname/TLS) no reabren el bloqueo de viabilidad; se tratan en implementación (SQL canónico) y fase 08 respectivamente.
