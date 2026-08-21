"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, PanelsTopLeft, Search, UserRound, UsersRound, X } from "lucide-react";
import { api } from "@/lib/api";
import { clearSession, getProfileId, getRefreshToken } from "@/lib/session";
import pkg from "@/package.json";
import type { Profile, User } from "@/types/nino";

const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function ProfileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.me(), api.profiles()]).then(([userResult, profilesResult]) => {
      if (!active) return;
      if (userResult.status === "fulfilled") setUser(userResult.value);
      if (profilesResult.status === "fulfilled") {
        const selectedId = getProfileId();
        setProfile(profilesResult.value.find((item) => item.id === selectedId) ?? profilesResult.value[0] ?? null);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => setImageFailed(false), [profile?.avatar]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(focusableSelector);
    window.requestAnimationFrame(() => first?.focus());

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" || event.key === "BrowserBack" || event.key === "GoBack") {
        event.preventDefault();
        setOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (!controls.length) return;
      const firstControl = controls[0];
      const lastControl = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function logout() {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await api.logout(refreshToken);
    } catch (error) {
      if (error instanceof Error) console.error("Déconnexion distante impossible :", error.message);
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  const avatarUrl = api.assetUrl(profile?.avatar ?? null);
  const displayName = profile?.name ?? user?.display_name ?? "Profil Nino";
  const initial = displayName.trim().slice(0, 1).toUpperCase() || "N";

  return (
    <>
      <button ref={triggerRef} className="profileAvatar" type="button" onClick={() => setOpen(true)} aria-label="Ouvrir le menu profil" aria-haspopup="dialog" aria-expanded={open}>
        {avatarUrl && !imageFailed ? <img src={avatarUrl} alt="" onError={() => setImageFailed(true)} /> : <span aria-hidden="true">{initial}</span>}
      </button>

      {open ? (
        <div className="profileMenuLayer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setOpen(false); triggerRef.current?.focus(); } }}>
          <div ref={dialogRef} className="profileMenuDialog" role="dialog" aria-modal="true" aria-labelledby="profile-menu-title">
            <header className="profileMenuHeader">
              <span className="profileMenuAvatar">
                {avatarUrl && !imageFailed ? <img src={avatarUrl} alt="" /> : <span aria-hidden="true">{initial}</span>}
              </span>
              <div><h2 id="profile-menu-title">{displayName}</h2><p>{user?.email ?? "Profil actif"}</p></div>
              <button className="profileMenuClose" type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Fermer le menu"><X size={18} aria-hidden="true" /></button>
            </header>

            <div className="profileMenuBody">
              <section aria-labelledby="profile-nav-title">
                <h3 id="profile-nav-title">Navigation</h3>
                <Link href="/" onClick={() => setOpen(false)}><Home size={19} aria-hidden="true" />Accueil</Link>
                <Link href="/search" onClick={() => setOpen(false)}><Search size={19} aria-hidden="true" />Recherche</Link>
                <Link href="/profiles" onClick={() => setOpen(false)}><UsersRound size={19} aria-hidden="true" />Changer de profil</Link>
              </section>

              {user?.is_admin ? <div className="profileMenuSeparator" /> : null}
              {user?.is_admin ? (
                <section aria-labelledby="profile-admin-title">
                  <h3 id="profile-admin-title">Administration</h3>
                  <Link href="/studio" onClick={() => setOpen(false)}><PanelsTopLeft size={19} aria-hidden="true" />Nino Studio</Link>
                </section>
              ) : null}

              <div className="profileMenuSeparator" />
              <section aria-label="Session">
                <button className="profileMenuDanger" type="button" onClick={() => void logout()}><LogOut size={19} aria-hidden="true" />Déconnexion</button>
              </section>
            </div>

            <footer><UserRound size={14} aria-hidden="true" /><span>Nino v{pkg.version}</span></footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
