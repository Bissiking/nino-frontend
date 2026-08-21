"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Home, LibraryBig, Radio, Search, Zap } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";
import { TvNavigation } from "./TvNavigation";
import pkg from "@/package.json";

const primaryNav = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/videos", label: "Vidéos", icon: Film },
  { href: "/series", label: "Séries", icon: LibraryBig },
  { href: "/live", label: "Direct", icon: Radio },
  { href: "/flashy", label: "Flashy", icon: Zap }
];

const mobileNav = [primaryNav[0], primaryNav[5], primaryNav[1], primaryNav[3]];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return !href.includes("#") && pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  return (
    <div className={`shell ${isStudio ? "isStudioShell" : ""}`}>
      <TvNavigation />
      <header className="topBar">
        <Link href="/" className="brand" aria-label="Nino — accueil">
          <Image src="/logo_nino.png" alt="Nino" width={111} height={42} priority />
        </Link>
        <nav className="desktopNav" aria-label="Navigation principale">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            return <Link className={active ? "active" : ""} href={item.href} key={item.label} aria-current={active ? "page" : undefined}>{item.label}</Link>;
          })}
        </nav>
        <div className="topActions">
          <ProfileMenu />
        </div>
      </header>

      <main className={`mainSurface ${pathname === "/" ? "homeSurface" : ""}`}>{children}</main>

      <footer className="ninoFooter" aria-label="Pied de page Nino">
        <div className="ninoFooterBrand"><Image src="/logo_nino_small.png" alt="" width={34} height={34} /><span><strong>Nino</strong><small>Version {pkg.version}</small></span></div>
        <nav aria-label="Liens rapides"><Link href="/">Accueil</Link><Link href="/search">Recherche</Link><Link href="/videos">Vidéos</Link><Link href="/series">Séries</Link><Link href="/live">Direct</Link><Link href="/flashy">Flashy</Link></nav>
        <small>Vos programmes. Votre univers.</small>
      </footer>

      <nav className="bottomNav" aria-label="Navigation mobile">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return <Link className={active ? "active" : ""} href={item.href} key={item.label} aria-label={item.label} aria-current={active ? "page" : undefined}><Icon size={21} aria-hidden="true" /><span>{item.label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
