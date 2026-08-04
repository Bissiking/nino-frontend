"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clapperboard, Compass, Gamepad2, History, Home, LogOut, PanelsTopLeft, Radio, Search, UserRound, Zap } from "lucide-react";
import { clearSession } from "@/lib/session";
import { TvNavigation } from "./TvNavigation";

const primaryNav = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/flashy", label: "Flashy", icon: Zap },
  { href: "/search", label: "Explorer", icon: Compass },
  { href: "/#series", label: "Séries gaming", icon: Gamepad2 },
  { href: "/#movies", label: "Émissions", icon: Clapperboard },
  { href: "/#live", label: "En direct", icon: Radio }
];

const secondaryNav = [
  { href: "/#continue", label: "Reprendre", icon: History },
  { href: "/profiles", label: "Changer de profil", icon: UserRound },
  { href: "/studio", label: "Nino Studio", icon: PanelsTopLeft }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return !href.includes("#") && pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="shell">
      <TvNavigation />
      <header className="topBar">
        <Link href="/" className="brand" aria-label="Nino — accueil">
          <Image src="/logo_nino.png" alt="Nino" width={111} height={42} priority />
        </Link>
        <Link href="/search" className="globalSearch" aria-label="Rechercher dans Nino">
          <Search size={19} aria-hidden="true" />
          <span>Rechercher une émission, une série, un créateur…</span>
          <kbd>/</kbd>
        </Link>
        <div className="topActions">
          <Link className="studioShortcut" href="/studio" aria-label="Ouvrir Nino Studio"><PanelsTopLeft size={20} aria-hidden="true" /></Link>
          <Link className="profileAvatar" href="/profiles" aria-label="Changer de profil"><UserRound size={21} aria-hidden="true" /></Link>
        </div>
      </header>

      <aside className="sidebar" aria-label="Navigation principale">
        <nav className="navList">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return <Link className={`navItem ${active ? "active" : ""}`} href={item.href} key={item.label} aria-current={active ? "page" : undefined}><Icon size={20} aria-hidden="true" /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="navDivider" />
        <p className="navLabel">Ma Nino</p>
        <nav className="navList">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return <Link className={`navItem ${active ? "active" : ""}`} href={item.href} key={item.label} aria-current={active ? "page" : undefined}><Icon size={20} aria-hidden="true" /><span>{item.label}</span></Link>;
          })}
        </nav>
        <button className="navItem logoutButton" type="button" onClick={() => { clearSession(); router.push("/login"); }}>
          <LogOut size={20} aria-hidden="true" /><span>Déconnexion</span>
        </button>
      </aside>

      <main className={`mainSurface ${pathname === "/" ? "homeSurface" : ""}`}>{children}</main>

      <nav className="bottomNav" aria-label="Navigation mobile">
        {primaryNav.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return <Link className={active ? "active" : ""} href={item.href} key={item.label} aria-label={item.label} aria-current={active ? "page" : undefined}><Icon size={21} aria-hidden="true" /><span>{item.label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
