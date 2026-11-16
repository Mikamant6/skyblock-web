"use client";
// Haelt Name, Profil und die Ergebnisse fuer alle Unterseiten von /profile.
// Das Layout bleibt beim Wechsel zwischen Unterseiten bestehen: der Besucher
// gibt den Namen nur einmal ein und die Daten werden nicht neu geladen.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { NetworthResponse } from "../../lib/networthService";
import type { ShardNetworthResponse } from "../../lib/shardService";
import type { SkillsResponse } from "../../lib/skillsService";
import type { SlayersResponse } from "../../lib/slayerService";
import { fetchApi } from "./fetchApi";

// Zustand einer Abfrage
export type Remote<T> =
  | { status: "idle" } // noch nichts abgefragt
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: T };

type ProfileContextValue = {
  playerName: string;
  setPlayerName: (value: string) => void;
  profileName: string;
  setProfileName: (value: string) => void;
  shards: Remote<ShardNetworthResponse>;
  networth: Remote<NetworthResponse>;
  skills: Remote<SkillsResponse>;
  slayers: Remote<SlayersResponse>;
  loading: boolean;
  // Spieler und Profil laut Server (Schreibweise von Mojang/Hypixel), sobald bekannt
  subject: { uuid: string; playerName: string; profileName: string } | null;
  // true, sobald einmal ein Profil erfolgreich geladen wurde (bleibt danach
  // true, auch wenn eine spaetere Eingabe fehlschlaegt). Steuert die Seitenleiste.
  hasProfile: boolean;
  submit: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (value === null) {
    throw new Error("useProfile must be used inside <ProfileProvider>");
  }
  return value;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState("");
  const [profileName, setProfileName] = useState("");
  const [shards, setShards] = useState<Remote<ShardNetworthResponse>>({ status: "idle" });
  const [networth, setNetworth] = useState<Remote<NetworthResponse>>({ status: "idle" });
  const [skills, setSkills] = useState<Remote<SkillsResponse>>({ status: "idle" });
  const [slayers, setSlayers] = useState<Remote<SlayersResponse>>({ status: "idle" });
  const [hasProfile, setHasProfile] = useState(false);

  // Zaehlt die Abfragen: kommt eine alte Antwort nach einer neuen Abfrage an,
  // wird sie verworfen
  const requestId = useRef(0);

  // Beim Start: Name/Profil aus dem Link (/?name=...&profile=...) oder den
  // zuletzt benutzten Werten aus dem Browser uebernehmen. Kommen sie aus dem
  // Link, wird gleich abgefragt (so lassen sich Profile teilen).
  const [autoSubmit, setAutoSubmit] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const linkName = params.get("name")?.trim().slice(0, 16) ?? "";
      const linkProfile = params.get("profile")?.trim().slice(0, 40) ?? "";
      if (linkName !== "" && window.location.pathname === "/") {
        setPlayerName(linkName);
        setProfileName(linkProfile);
        setAutoSubmit(true);
        return;
      }
      const saved = JSON.parse(window.localStorage.getItem("flawlesssb:last") ?? "null");
      if (saved && typeof saved.name === "string" && typeof saved.profile === "string") {
        setPlayerName(saved.name.slice(0, 16));
        setProfileName(saved.profile.slice(0, 40));
      }
    } catch {
      // Speicher gesperrt oder kaputt: dann eben ohne Vorbelegung
    }
  }, []);

  const loading = shards.status === "loading" || networth.status === "loading";

  const submit = useCallback(() => {
    if (loading) return;

    try {
      window.localStorage.setItem(
        "flawlesssb:last",
        JSON.stringify({ name: playerName.trim(), profile: profileName.trim() }),
      );
    } catch {
      // egal
    }

    const thisRequest = ++requestId.current;
    setShards({ status: "loading" });
    setNetworth({ status: "loading" });
    setSkills({ status: "loading" });
    setSlayers({ status: "loading" });

    const query = new URLSearchParams({
      name: playerName.trim(),
      profile: profileName.trim(),
    });

    // Beide Abfragen laufen gleichzeitig und melden sich einzeln zurueck.
    // Ein Fehler im einen Teil verhindert die Anzeige des anderen nicht.
    void fetchApi<ShardNetworthResponse>("/api/shards", query).then((result) => {
      if (thisRequest !== requestId.current) return;
      if (result.ok) setHasProfile(true);
      setShards(
        result.ok
          ? { status: "done", data: result.data }
          : { status: "error", message: result.message },
      );
    });
    void fetchApi<NetworthResponse>("/api/networth", query).then((result) => {
      if (thisRequest !== requestId.current) return;
      if (result.ok) setHasProfile(true);
      setNetworth(
        result.ok
          ? { status: "done", data: result.data }
          : { status: "error", message: result.message },
      );
    });
    // Skills laufen als dritte, unabhaengige Abfrage (blockiert die anderen nicht)
    void fetchApi<SkillsResponse>("/api/skills", query).then((result) => {
      if (thisRequest !== requestId.current) return;
      if (result.ok) setHasProfile(true);
      setSkills(
        result.ok
          ? { status: "done", data: result.data }
          : { status: "error", message: result.message },
      );
    });
    void fetchApi<SlayersResponse>("/api/slayers", query).then((result) => {
      if (thisRequest !== requestId.current) return;
      if (result.ok) setHasProfile(true);
      setSlayers(
        result.ok
          ? { status: "done", data: result.data }
          : { status: "error", message: result.message },
      );
    });
  }, [loading, playerName, profileName]);

  // Abfrage aus dem Link einmal automatisch starten, sobald die Werte gesetzt sind
  useEffect(() => {
    if (autoSubmit && playerName !== "") {
      setAutoSubmit(false);
      submit();
    }
  }, [autoSubmit, playerName, submit]);

  const subject = useMemo(() => {
    if (shards.status === "done") {
      return {
        uuid: shards.data.uuid,
        playerName: shards.data.playerName,
        profileName: shards.data.profileName,
      };
    }
    if (networth.status === "done") {
      return {
        uuid: networth.data.uuid,
        playerName: networth.data.playerName,
        profileName: networth.data.profileName,
      };
    }
    return null;
  }, [shards, networth]);

  const value: ProfileContextValue = {
    playerName,
    setPlayerName,
    profileName,
    setProfileName,
    shards,
    networth,
    skills,
    slayers,
    loading,
    subject,
    hasProfile,
    submit,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
