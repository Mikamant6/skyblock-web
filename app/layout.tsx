import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import AppShell from "./AppShell";
import { ProfileProvider } from "./profile/ProfileProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Schrift fuer Titel und Logo-Namen (Serife, passend zum Winter-Design)
const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "FlawlessSB", template: "%s | FlawlessSB" },
  description:
    "Tools for Hypixel SkyBlock: networth and shard value of your profile, calculated automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Setzt ein gemerktes Farbschema, bevor die Seite gezeichnet wird.
            "ok" ist die Liste der erlaubten Schemata (muss zu THEMES in ThemePicker.tsx passen). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var ok=["classic"];var t=localStorage.getItem("theme");if(ok.indexOf(t)>-1){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ProfileProvider>
          <AppShell>{children}</AppShell>
        </ProfileProvider>
      </body>
    </html>
  );
}
