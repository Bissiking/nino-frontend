"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Dialog } from "@/components/ui";
import { api, NinoApiError } from "@/lib/api";
import { clearSession, getProfileId, getRefreshToken } from "@/lib/session";
import { viewerNavigation, isNavigationActive } from "@/lib/navigation";
import pkg from "@/package.json";
import type { Profile, User } from "@/types/nino";

export function ProfileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [account, profiles] = await Promise.allSettled([api.me(), api.profiles()]);
    setUser(account.status === "fulfilled" ? account.value : null);
    if (profiles.status === "fulfilled") {
      const selectedId = getProfileId();
      // An invalid explicit profile must never silently become another profile.
      setProfile(selectedId ? profiles.value.find((item) => item.id === selectedId) ?? null : profiles.value[0] ?? null);
      setImageFailed(false);
    } else setProfile(null);
    const failure = account.status === "rejected" ? account.reason : profiles.status === "rejected" ? profiles.reason : null;
    if (failure) setError(failure instanceof NinoApiError && failure.status === 403 ? "Les informations du compte ne sont pas accessibles." : "Les informations du profil sont indisponibles. Vous pouvez continuer à naviguer ou réessayer.");
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function logout() {
    if (leaving) return;
    setLeaving(true);
    const refreshToken = getRefreshToken();
    try { if (refreshToken) await api.logout(refreshToken); }
    catch { /* Local session is cleared even when the server cannot be reached. */ }
    finally { clearSession(); router.push("/login"); }
  }

  const avatarUrl = api.assetUrl(profile?.avatar ?? null);
  const displayName = profile?.name ?? user?.display_name ?? "Votre espace Nino";
  const initial = displayName.trim().slice(0, 1).toUpperCase() || "N";
  const avatar = avatarUrl && !imageFailed ? <img src={avatarUrl} alt="" onError={() => setImageFailed(true)} /> : <span aria-hidden="true">{initial}</span>;

  return <>
    <button className="profileAvatar" type="button" onClick={() => setOpen(true)} aria-label="Ouvrir le menu profil" aria-haspopup="dialog" aria-expanded={open}>{avatar}</button>
    <Dialog open={open} onClose={() => setOpen(false)} title="Votre espace" className="ninoAccountDialog">
      <div className="ninoAccountIdentity"><span className="ninoAccountAvatar">{avatar}</span><div><strong>{displayName}</strong><p>{user?.email ?? "Profil Nino"}</p></div></div>
      {loading ? <p className="ninoMenuStatus" role="status">Chargement du profil…</p> : null}
      {error ? <div className="ninoMenuError" role="alert"><p>{error}</p><button type="button" onClick={() => void load()}><Icon name="retry" size={17} />Réessayer</button></div> : null}
      <nav className="ninoAccountNavigation" aria-label="Explorer Nino">
        {viewerNavigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined}><Icon name={item.icon} size={22} /><span>{item.label}</span><Icon name="chevron-right" size={16} /></Link>)}
      </nav>
      <div className="ninoAccountTools">
        <Link href="/profiles" onClick={() => setOpen(false)}><Icon name="users" size={21} /><span>Changer ou gérer les profils</span><Icon name="chevron-right" size={16} /></Link>
        {user?.is_admin ? <Link href={pathname.startsWith("/studio") ? "/" : "/studio/overview"} onClick={() => setOpen(false)}><Icon name="dashboard" size={21} /><span>{pathname.startsWith("/studio") ? "Retourner sur Nino" : "Ouvrir Nino Studio"}</span><Icon name="chevron-right" size={16} /></Link> : null}
      </div>
      <footer className="ninoAccountFooter"><small>Nino v{pkg.version}</small><button type="button" onClick={() => void logout()} disabled={leaving}><Icon name={leaving ? "loader" : "logout"} size={19} />{leaving ? "Déconnexion…" : "Se déconnecter"}</button></footer>
    </Dialog>
  </>;
}
