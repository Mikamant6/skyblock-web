"use client";
// Startseite: Eingabe von Minecraft-Name und Profil. Sobald ein Profil geladen
// ist, geht es automatisch zur Profil-Uebersicht, und die Seitenleiste erscheint.

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./calculator.module.css";
import ProfileForm from "./profile/ProfileForm";
import { useProfile } from "./profile/ProfileProvider";

export default function HomeEntry() {
  const router = useRouter();
  const { hasProfile, loading, subject, shards, networth } = useProfile();

  // Nur wenn auf dieser Seite gerade eine Abfrage lief und Daten da sind, geht es
  // weiter zur Uebersicht. Wer spaeter ueber "Home" zurueckkommt, bleibt hier.
  const sawLoading = useRef(false);
  useEffect(() => {
    if (loading) {
      sawLoading.current = true;
    } else if (sawLoading.current) {
      sawLoading.current = false;
      if (subject !== null) router.replace("/profile");
    }
  }, [loading, subject, router]);

  // Fehler zeigen wir erst, wenn beide Abfragen fertig sind und beide scheiterten
  const failed = !loading && shards.status === "error" && networth.status === "error";

  return (
    <>
      <header className={styles.header}>
        {/* Titelbild der Startseite: leuchtender Sumpfwald bei Nacht (blendet unten in den Hintergrund aus) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.banner}
          src="/themes/home-swamp.jpg"
          alt="A glowing blocky swamp forest at night under a square moon"
          width={1800}
          height={734}
        />
        <h1 className={styles.title}>
          FlawlessSB <span className={styles.beta}>Beta</span>
        </h1>
        <p className={styles.subtitle}>
          Tools for Hypixel SkyBlock. Enter a Minecraft name and a profile name
          and get your values automatically, without typing anything in by hand.
        </p>
      </header>

      <ProfileForm />

      {hasProfile && !loading && (
        <p>
          <Link className={styles.linkButton} href="/profile">
            Open the profile overview →
          </Link>
        </p>
      )}

      <div aria-live="polite">
        {failed && (
          <div className={styles.error} role="alert">
            {shards.status === "error" ? shards.message : ""}
          </div>
        )}
      </div>
    </>
  );
}
