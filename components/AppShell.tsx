"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProfileMenu } from "./ProfileMenu";
import { TvNavigation } from "./TvNavigation";
import { StudioShell } from "./studio/StudioShell";
import pkg from "@/package.json";
import { Menu } from "@/components/ui";
import { viewerNavigation, isNavigationActive } from "@/lib/navigation";

const explorerGroups = [{ label: "Explorer Nino", items: viewerNavigation.filter((item) => ["/videos", "/series"].includes(item.href)).map((item) => ({ ...item, id: item.href })) }];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  if (isStudio) return <StudioShell>{children}</StudioShell>;

  return (
    <div className="shell">
      <TvNavigation />
      <header className="topBar">
        <Link href="/" className="brand" aria-label="Nino — accueil">
          <Image src="/logo_nino.png" alt="Nino" width={111} height={42} priority />
        </Link>
        <nav className="desktopNav" aria-label="Navigation principale">
          <Link className={pathname === "/" ? "active" : ""} href="/" aria-current={pathname === "/" ? "page" : undefined}>Accueil</Link>
          <Menu key={pathname} label="Explorer" trigger={<>Explorer<Icon name="chevron-down" size={15} /></>} groups={explorerGroups} active={["/videos", "/series"].some((href) => isNavigationActive(pathname, href))} />
          <Link className={pathname === "/flashy" ? "active" : ""} href="/flashy" aria-current={pathname === "/flashy" ? "page" : undefined}>Flashy</Link>
        </nav>
        <div className="topActions">
          <Link href="/search" className="ninoSearchAction" aria-label="Rechercher un programme"><Icon name="search" size={22} /></Link>
          <ProfileMenu key={pathname} />
        </div>
      </header>

      <main className={`mainSurface ${pathname === "/" ? "homeSurface" : ""}`}>{children}</main>

      <footer className="ninoFooter" aria-label="Pied de page Nino">
        <div className="ninoFooterBrand"><Image src="/logo_nino_small.png" alt="" width={34} height={34} /><span><strong>Nino</strong><small>Version {pkg.version}</small></span></div>
        <nav aria-label="Liens rapides">{viewerNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
        <small>Vos programmes. Votre univers.</small>
      </footer>

      <nav className="bottomNav" aria-label="Navigation mobile">
        {[viewerNavigation[0], viewerNavigation[4], viewerNavigation[3]].map((item) => {
          const active = isNavigationActive(pathname, item.href);
          return <Link className={active ? "active" : ""} href={item.href} key={item.label} aria-label={item.label} aria-current={active ? "page" : undefined}><Icon name={item.icon} variant="outline" size={21} /><span>{item.label}</span></Link>;
        })}
        <Menu key={pathname} label="Explorer" trigger={<><Icon name="library" size={21} /><span>Explorer</span></>} groups={explorerGroups} placement="top" active={["/videos", "/series"].some((href) => isNavigationActive(pathname, href))} />
      </nav>
    </div>
  );
}
