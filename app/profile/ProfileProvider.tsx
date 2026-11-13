"use client";
// Haelt Name, Profil und die Ergebnisse fuer alle Unterseiten von /profile.
// Das Layout bleibt beim Wechsel zwischen Unterseiten bestehen: der Besucher
// gibt den Namen nur einmal ein und die Daten werden nicht neu geladen.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { NetworthResponse } from "../../lib/networthService";
import type { ShardNetworthResponse } from "../../lib/shardService";
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
  const [hasProfile, setHasProfile] = useState(false);

  // Zaehlt die Abfragen: kommt eine alte Antwort nach einer neuen Abfrage an,
  // wird sie verworfen
  const requestId = useRef(0);

  const loading = shards.status === "loading" || networth.status === "loading";

  const submit = useCallback(() => {
    if (loading) return;

    const thisRequest = ++requestId.current;
    setShards({ status: "loading" });
    setNetworth({ status: "loading" });

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
  }, [loading, playerName, profileName]);

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
    loading,
    subject,
    hasProfile,
    submit,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
