"use client";
// Kopf des Minecraft-Skins eines Spielers. Das Skin-Bild kommt von unserem
// Server (/api/skin); der Kopf (Gesicht + Hut-Ebene) wird hier auf eine
// Zeichenflaeche geschnitten. Klappt das nicht, nehmen wir ersatzweise einen
// Fremddienst, und zuletzt bleibt ein leerer Platz.

import { useEffect, useRef, useState } from "react";

const FALLBACK = (uuid: string, size: number) =>
  `https://mc-heads.net/avatar/${uuid}/${size}`;

export default function PlayerAvatar({
  uuid,
  size = 48,
}: {
  uuid: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // "skin" = eigener Server, "fallback" = Fremddienst, "none" = nichts
  const [mode, setMode] = useState<"skin" | "fallback" | "none">("skin");

  useEffect(() => {
    if (mode !== "skin") return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (cancelled || !canvas || !context) return;
      context.imageSmoothingEnabled = false; // harte Pixel statt Verwaschen
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 8, 8, 8, 8, 0, 0, canvas.width, canvas.height); // Gesicht
      context.drawImage(image, 40, 8, 8, 8, 0, 0, canvas.width, canvas.height); // Hut-Ebene
    };
    image.onerror = () => {
      if (!cancelled) setMode("fallback");
    };
    image.src = `/api/skin?uuid=${encodeURIComponent(uuid)}`;
    return () => {
      cancelled = true;
    };
  }, [uuid, mode]);

  const style = { width: size, height: size, borderRadius: 6, imageRendering: "pixelated" as const };

  if (mode === "skin") {
    return <canvas ref={canvasRef} width={64} height={64} style={style} aria-hidden="true" />;
  }
  if (mode === "fallback") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={FALLBACK(uuid, size * 2)}
        alt=""
        style={style}
        onError={() => setMode("none")}
      />
    );
  }
  return <span aria-hidden="true" style={{ width: size, height: size, display: "inline-block" }} />;
}
