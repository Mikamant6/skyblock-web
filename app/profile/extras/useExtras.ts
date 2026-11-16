"use client";
// Holt Minions, Pets und Dungeons fuer das aktuelle Profil (fuer die drei Unterseiten).
import { useEffect, useState } from "react";
import type { ExtrasResponse } from "../../../lib/extrasService";
import { fetchApi } from "../fetchApi";
import { useProfile } from "../ProfileProvider";

type Result = { key: string; ok: true; data: ExtrasResponse } | { key: string; ok: false; message: string };

export function useExtras(): { status: "loading" } | { status: "error"; message: string } | { status: "done"; data: ExtrasResponse } {
  const { subject } = useProfile();
  const name = subject?.playerName ?? "";
  const profile = subject?.profileName ?? "";
  const key = `${name}/${profile}`;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (name === "") return;
    let cancelled = false;
    void fetchApi<ExtrasResponse>("/api/extras", new URLSearchParams({ name, profile })).then((r) => {
      if (cancelled) return;
      setResult(r.ok ? { key, ok: true, data: r.data } : { key, ok: false, message: r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [name, profile, key]);

  // Ein Ergebnis zaehlt nur, wenn es zum aktuellen Profil gehoert
  if (result === null || result.key !== key) return { status: "loading" };
  return result.ok ? { status: "done", data: result.data } : { status: "error", message: result.message };
}
