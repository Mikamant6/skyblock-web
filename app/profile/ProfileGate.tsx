"use client";
// Wer /profile ohne Eingabe oeffnet und auch nichts im Browser gespeichert hat,
// wird zur Startseite mit dem Eingabeformular geschickt. Gibt es Name und Profil im Link
// oder im Browser-Speicher, fragt der ProfileProvider selbst ab (Neuladen funktioniert).

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useProfile } from "./ProfileProvider";

export default function ProfileGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { hasProfile, loading, pending } = useProfile();

  useEffect(() => {
    if (!hasProfile && !loading && !pending) router.replace("/");
  }, [hasProfile, loading, pending, router]);

  if (!hasProfile) return null;
  return <>{children}</>;
}
