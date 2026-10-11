import Feasibility from "../feasibility";
import Link from "next/link";

export const metadata = {
  title: "Second Brain · Pruebas de evidencia",
};

export default function FeasibilityPage() {
  return (
    <main className="developer-page">
      <p className="eyebrow">Out of the Box / Developer route</p>
      <h1>Pruebas deterministas de evidencia</h1>
      <p>Fixtures sintéticos congelados de fase 00. Esta pantalla no pertenece al flujo de cuentas ni almacena documentos de usuarios.</p>
      <Link className="button secondary" href="/">Volver a Second Brain</Link>
      <Feasibility />
    </main>
  );
}
