// Hinweise fuer Suchmaschinen: Startseite und Rechtstexte duerfen gelesen werden,
// die Profil-Seiten (brauchen eine Eingabe) und die API nicht.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/profile"] }],
    sitemap: "https://flawlesssb.de/sitemap.xml",
  };
}
