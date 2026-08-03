import type { Metadata, Viewport } from "next";
import "@fontsource-variable/sora";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nino V8",
  description: "Plateforme personnelle de streaming video",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#0d0b0f",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* THESIS: Nino unifies creator shows, live programs and vertical Flashy videos in a familiar TV-first streaming home.
OWN-WORLD: near-black plum viewing surfaces, coral-to-orange brand moments, image-led rails and compact video-platform controls.
STORY: a profile enters, sees the featured program, scans categories and the ranked Top 10, then watches or opens Flashy.
FIRST VIEWPORT: a fixed YouTube-like navigation frames a Netflix-scale hero; categories and a Prime-style Top 10 begin below.
FORM: operate surface, category-standard streaming direction explicitly chosen from seed 7df646fe.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
        {children}
      </body>
    </html>
  );
}
