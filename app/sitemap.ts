// Liste der Seiten, die Suchmaschinen finden sollen.
import type { MetadataRoute } from "next";

const BASE = "https://flawlesssb.de";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/credits", "/datenschutz"].map((path) => ({ url: `${BASE}${path}` }));
}
