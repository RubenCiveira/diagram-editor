import * as React from "react";
import VerifyGuard from "../VerifyGuard/VerifyGuard";
import AutorizeGuard from "../AutorizeGuard/AutorizeGuard";

type Props = {
  onReady: () => void; // la app cerrará el diálogo cuando se llame
  AuthComponent: React.ComponentType<{ onSuccess: () => void }>;
  title?: string;
  step?: "intro" | "auth" | "verify" | "role";
  setStep: (step: "intro" | "auth" | "verify" | "role") => void;
};

export default function AccessGate({ onReady, AuthComponent, title, step, setStep }: Props) {
  if (step === "intro") {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">
          {title ?? "Editor de Diagramas con Metadatos"}
        </h1>
        <p className="opacity-80 mb-4">
          Crea y gestiona diagramas (C4, vistas, metadatos), guarda en repositorios
          y exporta a PlantUML/Kroki.
        </p>
        <ul className="list-disc ml-5 mb-6 opacity-80">
          <li>Repositorio seguro (Appwrite).</li>
          <li>Colaboración y versionado.</li>
          <li>Exportación flexible.</li>
        </ul>
        <button className="px-4 py-2 rounded bg-black text-white" onClick={() => setStep("auth")}>
          Ir al login / registro
        </button>
      </div>
    );
  
  } else if( step === 'verify' ) {
    return <VerifyGuard onSuccess={onReady} />
  } else if( step === 'role') {
    return <AutorizeGuard onSuccess={onReady} />
  } else {
    return (
        <div className="p-6 max-w-xl mx-auto">
        <AuthComponent onSuccess={onReady} />
        </div>
    );
}
}
