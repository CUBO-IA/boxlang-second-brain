import Feasibility from "../feasibility";
import Link from "next/link";

export const metadata = {
  title: "Terengue · Pruebas de evidencia",
};

export default function FeasibilityPage() {
  return (
    <main className="developer-page">
      <p className="eyebrow">Out of the Box / Developer route</p>
      <h1>Pruebas deterministas de evidencia</h1>
      <p>Fixtures sintéticos congelados de fase 00. Esta pantalla no pertenece al flujo de cuentas ni almacena documentos de usuarios.</p>
      <Link className="button secondary" href="/app">Volver a Terengue</Link>
      <Feasibility />
    </main>
  );
}
