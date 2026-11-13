"use client";
// Wer /profile ohne Eingabe oeffnet (z. B. nach dem Neuladen der Seite, wenn der
// Browser alles vergessen hat), wird zur Startseite mit dem Eingabeformular geschickt.

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useProfile } from "./ProfileProvider";

export default function ProfileGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { hasProfile, loading } = useProfile();

  useEffect(() => {
    if (!hasProfile && !loading) router.replace("/");
  }, [hasProfile, loading, router]);

  if (!hasProfile) return null;
  return <>{children}</>;
}
