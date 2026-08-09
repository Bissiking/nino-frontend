"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, PanelsTopLeft, Search, Zap } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";
import { TvNavigation } from "./TvNavigation";

const primaryNav = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/#latest", label: "Vidéos", icon: Compass },
  { href: "/#series", label: "Séries", icon: Compass },
  { href: "/#live", label: "Live", icon: Compass },
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
          <Link className="studioShortcut" href="/studio" aria-label="Ouvrir Nino Studio"><PanelsTopLeft size={20} aria-hidden="true" /></Link>
          <ProfileMenu />
        </div>
      </header>

      <main className={`mainSurface ${pathname === "/" ? "homeSurface" : ""}`}>{children}</main>

      <footer className="ninoFooter" aria-label="Pied de page Nino">
        <div className="ninoFooterBrand"><Image src="/logo_nino_small.png" alt="" width={34} height={34} /><span><strong>Nino</strong><small>Version 8 · interface V7</small></span></div>
        <nav aria-label="Liens rapides"><Link href="/">Accueil</Link><Link href="/search">Recherche</Link><Link href="/#latest">Vidéos</Link><Link href="/#series">Séries</Link><Link href="/#live">Live</Link><Link href="/flashy">Flashy</Link></nav>
        <small>Frontend indépendant Nino</small>
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
