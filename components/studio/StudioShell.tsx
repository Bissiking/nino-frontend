"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Dialog, Sheet, Menu } from "@/components/ui";
import { ProfileMenu } from "@/components/ProfileMenu";
import { TvNavigation } from "@/components/TvNavigation";
import { StudioNotifications } from "@/components/studio/StudioNotifications";
import { api } from "@/lib/api";
import { studioNavigation, isNavigationActive } from "@/lib/navigation";
import type { User } from "@/types/nino";

const createGroups = [{ label: "Ajouter à la bibliothèque", items: [
  { id: "video", href: "/studio/videos/new", label: "Nouvelle vidéo", description: "Vidéo ou épisode d’une série", icon: "video" },
  { id: "flashy", href: "/studio/videos/new?kind=short", label: "Nouveau Flashy", description: "Format court vertical", icon: "flashy" },
  { id: "series", href: "/studio/series/new", label: "Nouvelle série", description: "Organiser des saisons et épisodes", icon: "library" }
] }];

export function StudioShell({ children, immersive = false }: { children: React.ReactNode; immersive?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    api.me().then((account) => { if (active) setUser(account); }).catch(() => null);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !document.querySelector("dialog[open]")) {
        event.preventDefault(); setSearchOpen(true);
      }
    }
    function onResize() { if (window.innerWidth > 860) setMenuOpen(false); }
    window.addEventListener("keydown", onShortcut);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("keydown", onShortcut); window.removeEventListener("resize", onResize); };
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSearchOpen(false);
    router.push(search.trim() ? `/studio/videos?q=${encodeURIComponent(search.trim())}` : "/studio/videos");
  }

  function navigation() {
    return <nav className="ninoStudioNavigation" aria-label="Navigation Nino Studio">
      {studioNavigation.map((group) => <section key={group.label}><h2>{group.label}</h2>{group.items.map((item) => {
        const active = isNavigationActive(pathname, item.href) || (item.href === "/studio/videos" && pathname.startsWith("/studio/media/"));
        return <Link key={item.href} title={item.label} href={item.href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined}><Icon name={item.icon} size={21} /><span>{item.label}</span></Link>;
      })}</section>)}
    </nav>;
  }

  return <div className={`studioShell ninoNavigationRefresh ${immersive ? "isImmersive" : ""}`}>
    <TvNavigation />
    <header className="studioShellHeader">
      <div className="studioShellBrandRow">
        <button className="studioMenuToggle" type="button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir la navigation" aria-haspopup="dialog" aria-expanded={menuOpen}><Icon name="menu" size={23} /></button>
        <Link className="studioShellBrand" href="/studio/overview" aria-label="Nino Studio — tableau"><Image src="/logo_nino.png" alt="Nino" width={92} height={35} priority /><span>Studio</span></Link>
      </div>
      <button className="ninoStudioSearch" type="button" onClick={() => setSearchOpen(true)} aria-label="Rechercher dans Nino Studio" aria-haspopup="dialog" aria-expanded={searchOpen}><Icon name="search" size={20} /><span>Rechercher dans Studio</span><kbd>Ctrl / ⌘ K</kbd></button>
      <div className="studioShellActions">
        {user?.is_admin ? <Menu key={`create:${pathname}`} label="Créer un contenu" trigger={<><Icon name="plus" size={20} /><span>Créer</span></>} triggerClassName="ninoCreateTrigger" groups={createGroups} /> : null}
        <StudioNotifications key={`notifications:${pathname}`} />
        <ProfileMenu key={`account:${pathname}`} />
      </div>
    </header>
    <aside className="studioShellSidebar" aria-label="Espace Studio">
      {user?.is_admin ? navigation() : <p className="ninoMenuStatus">{user ? "Accès administrateur requis" : "Vérification de l’accès…"}</p>}
      <Link className="ninoStudioBack" href="/"><Icon name="chevron-left" size={18} /><span>Retourner sur Nino</span></Link>
    </aside>
    <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Nino Studio" className="ninoStudioDrawer">
      {user?.is_admin ? navigation() : <p>Accès administrateur requis.</p>}
      <Link className="ninoStudioBack" href="/" onClick={() => setMenuOpen(false)}><Icon name="chevron-left" size={18} />Retourner sur Nino</Link>
    </Sheet>
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Rechercher dans Studio" className="ninoSearchDialog" initialFocus="#studio-command-query">
      <form className="ninoCommandSearch" role="search" onSubmit={submitSearch}>
        <label htmlFor="studio-command-query">Titre, synopsis ou genre d’une vidéo</label>
        <div><Icon name="search" size={22} /><input id="studio-command-query" type="search" maxLength={120} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Que cherchez-vous ?" /><button type="submit">Rechercher</button></div>
      </form>
      <nav className="ninoQuickLinks" aria-label="Accès rapide Studio"><h3>Accès rapide</h3>{studioNavigation.flatMap((group) => group.items).map((item) => <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)}><Icon name={item.icon} size={20} /><span>{item.label}</span><Icon name="chevron-right" size={16} /></Link>)}</nav>
    </Dialog>
    <main className="studioShellContent">{children}</main>
  </div>;
}
