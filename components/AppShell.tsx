"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Clapperboard, Heart, Home, LogOut, Radio, Search, Settings, Tv } from "lucide-react";
import { clearSession } from "@/lib/session";

const nav = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/?kind=movie", label: "Films", icon: Clapperboard },
  { href: "/?kind=series", label: "Series", icon: Tv },
  { href: "/?kind=live", label: "Live", icon: Radio },
  { href: "/admin", label: "Admin", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Navigation principale">
        <Link href="/" className="brand" aria-label="Nino accueil">
          <span className="brandMark">N</span>
          <span>Nino</span>
        </Link>
        <nav className="navList">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link className={`navItem ${active ? "active" : ""}`} href={item.href} key={item.label}>
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sideActions">
          <button className="iconTextButton" type="button" title="Notifications">
            <Bell size={18} aria-hidden="true" />
            <span>Notifications</span>
          </button>
          <button
            className="iconTextButton"
            type="button"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Sortir</span>
          </button>
        </div>
      </aside>
      <main className="mainSurface">{children}</main>
      <nav className="bottomNav" aria-label="Navigation mobile">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.label} aria-label={item.label}>
              <Icon size={22} aria-hidden="true" />
            </Link>
          );
        })}
        <Link href="/profiles" aria-label="Favoris et profil">
          <Heart size={22} aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}

