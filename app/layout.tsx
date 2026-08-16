import type { Metadata, Viewport } from "next";
import { SessionGate } from "@/components/SessionGate";
import "@fontsource-variable/sora";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nino V8",
  description: "Plateforme personnelle de streaming video",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo_nino_small.png",
    apple: "/logo_nino_small.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SessionGate>{children}</SessionGate>
      </body>
    </html>
  );
}
