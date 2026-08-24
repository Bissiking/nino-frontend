"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Clapperboard,
  Film,
  LayoutDashboard,
  Menu,
  Plus,
  Radio,
  Search,
  Settings,
  X,
  Zap
} from "lucide-react";
import { ProfileMenu } from "@/components/ProfileMenu";
import { StudioNotifications } from "@/components/studio/StudioNotifications";
import { api } from "@/lib/api";

const studioNav = [
  { id: "overview", href: "/studio/overview", label: "Tableau", icon: LayoutDashboard },
  { id: "videos", href: "/studio/videos", label: "Vidéos", icon: Film },
  { id: "series", href: "/studio/series", label: "Séries", icon: Clapperboard },
  { id: "flashy", href: "/studio/flashy", label: "Flashy", icon: Zap },
  { id: "schedule", href: "/studio/schedule", label: "Planning", icon: CalendarDays },
  { id: "live", href: "/studio/live", label: "Direct", icon: Radio },
  { id: "administration", href: "/studio/administration", label: "Système", icon: Settings }
];

export function StudioShell({ children, immersive = false }: { children: React.ReactNode; immersive?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState("Compte Nino");

  useEffect(() => {
    if (!createOpen) return;
    function close(event: MouseEvent) {
      if (!createRef.current?.contains(event.target as Node)) setCreateOpen(false);
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") setCreateOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", keydown);
    };
  }, [createOpen]);

  useEffect(() => {
    let active = true;
    api.me().then((user) => { if (active) setDisplayName(user.display_name || user.email); }).catch(() => null);
    return () => { active = false; };
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("studio-global-search")?.focus();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/studio/videos?q=${encodeURIComponent(query)}` : "/studio/videos");
  }

  const activeSection = pathname.includes("/studio/overview") ? "overview"
    : pathname.includes("/studio/videos") ? "videos"
    : pathname.includes("/studio/series") ? "series"
    : pathname.includes("/studio/flashy") ? "flashy"
    : pathname.includes("/studio/schedule") ? "schedule"
    : pathname.includes("/studio/live") ? "live"
    : pathname.includes("/studio/transcode") || pathname.includes("/studio/administration") ? "administration"
    : "";

  return (
    <div className={`studioShell ${immersive ? "isImmersive" : ""}`}>
      <header className="studioShellHeader">
        <div className="studioShellBrandRow">
          <button className="studioMenuToggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Fermer la navigation" : "Ouvrir la navigation"} aria-expanded={menuOpen}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link className="studioShellBrand" href="/studio/overview" aria-label="Nino Studio — tableau">
            <Image src="/logo_nino.png" alt="Nino" width={92} height={35} priority />
            <span>Studio</span>
          </Link>
        </div>

        <form className="studioGlobalSearch" role="search" onSubmit={submitSearch}>
          <Search size={18} aria-hidden="true" />
          <input id="studio-global-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un titre, un synopsis ou un genre…" aria-label="Rechercher dans Nino Studio" />
          <kbd aria-hidden="true">⌘ K</kbd>
        </form>

        <div className="studioShellActions">
          <div className="studioCreateMenu" ref={createRef}>
            <button className="primaryButton studioNewMedia" type="button" onClick={() => setCreateOpen((value) => !value)} aria-haspopup="menu" aria-expanded={createOpen}><Plus size={18} aria-hidden="true" /><span>Créer</span></button>
            {createOpen ? <div role="menu"><Link role="menuitem" href="/studio/videos/new" onClick={() => setCreateOpen(false)}><Film size={17} />Nouvelle vidéo</Link><Link role="menuitem" href="/studio/flashy" onClick={() => setCreateOpen(false)}><Zap size={17} />Nouveau Flashy</Link><Link role="menuitem" href="/studio/series/new" onClick={() => setCreateOpen(false)}><Clapperboard size={17} />Nouvelle série</Link></div> : null}
          </div>
          <StudioNotifications />
          <span className="studioAccountCopy"><strong>{displayName}</strong><small>Administrateur</small></span>
          <ProfileMenu />
        </div>
      </header>

      <aside className={`studioShellSidebar ${menuOpen ? "isOpen" : ""}`} aria-label="Navigation Nino Studio">
        <Link className="studioSidebarBrand" href="/studio/overview" aria-label="Nino Studio — tableau">
          <Image src="/logo_nino.png" alt="Nino" width={108} height={41} priority />
          <span>Studio</span>
        </Link>
        <nav>
          {studioNav.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return <Link key={item.id} href={item.href} className={active ? "isActive" : undefined} aria-current={active ? "page" : undefined}><Icon size={19} aria-hidden="true" /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="studioSidebarAccount">
          <ProfileMenu />
          <span><strong>{displayName}</strong><small>Administrateur</small></span>
        </div>
        <Link className="studioBackToNino" href="/">Retourner sur Nino</Link>
      </aside>

      {menuOpen ? <button className="studioSidebarBackdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Fermer la navigation" /> : null}
      <main className="studioShellContent">{children}</main>
    </div>
  );
}
