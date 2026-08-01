import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nino V8",
  description: "Plateforme personnelle de streaming video",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#07100d",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* THESIS: Nino is a signal console for a private media library, refusing generic streaming rows without system status.
OWN-WORLD: near-black phosphor console, precise rails, square graticule texture, compact controls and measurable playback states.
STORY: the user authenticates, chooses a profile, resumes or finds media, then lets the backend decide playback.
FIRST VIEWPORT: sidebar control rail, large live signal hero, and scrollable media rails with progress traces.
FORM: operate surface, signal-bench direction from seed 3a1fb834.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
        {children}
      </body>
    </html>
  );
}

