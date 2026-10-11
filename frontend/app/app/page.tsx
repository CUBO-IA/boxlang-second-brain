import { SecondBrainApp } from "../components/SecondBrainApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  let backendReady = false;
  try {
    const response = await fetch(`${process.env.BOXLANG_URL}/api/health.bxm`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.status !== "ok" || result.backend !== "BoxLang") {
      throw new Error("Respuesta inesperada del backend.");
    }
    backendReady = true;
  } catch (error) {
    console.error("No se pudo comprobar BoxLang:", error instanceof Error ? error.message : error);
  }

  return <SecondBrainApp backendReady={backendReady} />;
}
