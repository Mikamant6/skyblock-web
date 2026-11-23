"use client";
// Kopf des Minecraft-Skins eines Spielers. Das Skin-Bild kommt von unserem
// Server (/api/skin); der Kopf (Gesicht + Hut-Ebene) wird hier auf eine
// Zeichenflaeche geschnitten. Klappt das nicht, bleibt ein leerer Platz
// (bewusst kein Fremddienst, damit keine Daten an Dritte gehen).

import { useEffect, useRef, useState } from "react";

export default function PlayerAvatar({
  uuid,
  size = 48,
}: {
  uuid: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // "skin" = eigener Server, "none" = nichts
  const [mode, setMode] = useState<"skin" | "none">("skin");

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
      if (!cancelled) setMode("none");
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
  return <span aria-hidden="true" style={{ width: size, height: size, display: "inline-block" }} />;
}
