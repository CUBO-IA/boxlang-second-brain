export const dynamic = "force-dynamic";

export default async function Home() {
  let result;
  try {
    const response = await fetch(`${process.env.BOXLANG_URL}/api/health.bxm`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    result = await response.json();
    if (result.status !== "ok" || result.backend !== "BoxLang") {
      throw new Error("Respuesta inesperada del backend.");
    }
  } catch (error) {
    console.error("No se pudo comprobar BoxLang:", error instanceof Error ? error.message : error);
    result = null;
  }

  return (
    <main>
      <p className="label">Out of the Box / Second Brain</p>
      <h1>Next.js <span aria-hidden="true">↔</span> BoxLang</h1>
      <p className="status" data-backend-status={result ? "ok" : "error"}>
        {result ? "Conexión correcta" : "Backend no disponible"}
      </p>
      <p>
        {result
          ? "El frontend ha recibido la respuesta del GET de BoxLang."
          : "Comprueba el servicio boxlang con docker compose logs boxlang y vuelve a intentarlo."}
      </p>
      <section aria-label="Respuesta del backend">
        <p className="label">GET /api/health.bxm</p>
        <pre>{result ? JSON.stringify(result, null, 2) : "Sin respuesta válida."}</pre>
      </section>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Recarga completa para volver a consultar BoxLang. */}
      <a href="/">Comprobar de nuevo</a>
    </main>
  );
}
