// Zeigt "laedt" oder den Fehlertext; gibt die Daten zurueck, sobald sie da sind.
import calc from "../../calculator.module.css";
import type { ExtrasResponse } from "../../../lib/extrasService";
import { useExtras } from "./useExtras";

export default function ExtrasGate({ children }: { children: (data: ExtrasResponse) => React.ReactNode }) {
  const state = useExtras();
  if (state.status === "loading") {
    return (
      <div className={calc.notice} role="status">
        Loading...
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className={calc.error} role="alert">
        {state.message}
      </div>
    );
  }
  return <>{children(state.data)}</>;
}
