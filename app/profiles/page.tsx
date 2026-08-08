"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { api } from "@/lib/api";
import { getProfileId, saveProfileId } from "@/lib/session";
import type { Profile } from "@/types/nino";
import { ErrorState, LoadingState } from "@/components/StateBlock";

type EditorTarget = Profile | "new" | null;

function moveProfileFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (!new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]).has(event.key)) return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
  const index = controls.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  const columns = window.innerWidth <= 600 ? 2 : Math.max(1, Math.floor(event.currentTarget.clientWidth / 180));
  const offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -columns : columns;
  const target = controls[index + offset];
  if (!target) return;
  event.preventDefault();
  target.focus();
}

function ProfileAvatar({ profile, previewUrl }: { profile?: Profile; previewUrl?: string | null }) {
  const source = previewUrl ?? api.assetUrl(profile?.avatar ?? null);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [source]);
  return (
    <span className="avatarDisc">
      {source && !imageFailed ? <img src={source} alt="" width={112} height={112} onError={() => setImageFailed(true)} /> : <UserRound size={42} aria-hidden="true" />}
    </span>
  );
}

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editor, setEditor] = useState<EditorTarget>(null);
  const [manageMode, setManageMode] = useState(false);
  const [name, setName] = useState("");
  const [maturityLevel, setMaturityLevel] = useState("all");
  const [language, setLanguage] = useState("fr");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    api.profiles().then(setProfiles).catch((err) => setError(err.message ?? "Profils indisponibles.")).finally(() => setLoading(false));
  }

  useEffect(load, []);
  useEffect(() => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function openEditor(target: Profile | "new") {
    setEditor(target);
    setName(target === "new" ? "" : target.name);
    setMaturityLevel(target === "new" ? "all" : target.maturity_level);
    setLanguage(target === "new" ? "fr" : target.language);
    setAvatarFile(null);
    setPreviewUrl(null);
    setFormError(null);
  }

  function chooseAvatar(file: File | null) {
    setFormError(null);
    if (!file) return;
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setFormError("Choisissez une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 2_097_152) {
      setFormError("L’image doit peser moins de 2 Mo.");
      return;
    }
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;
    setSaving(true);
    setFormError(null);
    let persistedProfile: Profile | null = null;
    try {
      let profile = editor === "new"
        ? await api.createProfile({ name: name.trim(), maturity_level: maturityLevel, language })
        : await api.updateProfile(editor.id, { name: name.trim(), maturity_level: maturityLevel, language });
      persistedProfile = profile;
      if (avatarFile) profile = await api.uploadProfileAvatar(profile.id, avatarFile);
      setProfiles((current) => editor === "new" ? [...current, profile] : current.map((item) => item.id === profile.id ? profile : item));
      setEditor(null);
    } catch (err) {
      if (editor === "new" && persistedProfile) {
        const createdProfile = persistedProfile;
        setProfiles((current) => current.some((item) => item.id === createdProfile.id) ? current : [...current, createdProfile]);
        setEditor(createdProfile);
      }
      setFormError(err instanceof Error ? err.message : "Impossible d’enregistrer ce profil.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProfile(profile: Profile) {
    if (!window.confirm(`Supprimer le profil « ${profile.name} » et ses données de lecture ?`)) return;
    setFormError(null);
    try {
      await api.deleteProfile(profile.id);
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      if (getProfileId() === profile.id) window.localStorage.removeItem("nino.profile");
      setEditor(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Impossible de supprimer ce profil.");
    }
  }

  const editedProfile = editor && editor !== "new" ? editor : undefined;

  return (
    <main className="profileScreen">
      <div className="profileHeader">
        <Image src="/logo_nino.png" alt="Nino" width={139} height={53} priority />
        <h1>{manageMode ? "Gérer les profils" : "Qui regarde ?"}</h1>
        <p>{manageMode ? "Créez jusqu’à huit profils et personnalisez leur image." : "Choisissez votre profil pour personnaliser Nino."}</p>
        <button className="secondaryButton" type="button" onClick={() => { setManageMode((current) => !current); setEditor(null); }}>{manageMode ? <X size={18} /> : <Pencil size={18} />}{manageMode ? "Terminer" : "Gérer les profils"}</button>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <div className={`profileWorkspace ${editor ? "hasEditor" : ""}`}>
          <div className="profileGrid" onKeyDown={moveProfileFocus}>
            {profiles.map((profile) => (
              <button className="profileTile" key={profile.id} type="button" onClick={() => {
                if (manageMode) openEditor(profile);
                else { saveProfileId(profile.id); router.push("/"); }
              }}>
                <ProfileAvatar profile={profile} />
                <span>{profile.name}</span>
                {manageMode ? <small><Pencil size={14} />Modifier</small> : null}
              </button>
            ))}
            {manageMode && profiles.length < 8 ? <button className="profileTile addProfileTile" type="button" onClick={() => openEditor("new")}><span className="avatarDisc"><Plus size={38} /></span><span>Ajouter un profil</span></button> : null}
          </div>

          {editor ? (
            <form className="profileEditor" onSubmit={submit}>
              <header><div><h2>{editor === "new" ? "Nouveau profil" : `Modifier ${editor.name}`}</h2><p>Ces réglages personnalisent la navigation et l’historique.</p></div><button className="studioIconButton" type="button" onClick={() => setEditor(null)} aria-label="Fermer l’éditeur"><X size={19} /></button></header>
              <label className="profileAvatarPicker"><ProfileAvatar profile={editedProfile} previewUrl={previewUrl} /><span><Camera size={17} />Choisir une image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseAvatar(event.target.files?.[0] ?? null)} /></span><small>JPEG, PNG ou WebP · 2 Mo maximum</small></label>
              <label>Nom du profil<input value={name} onChange={(event) => setName(event.target.value)} minLength={1} maxLength={80} required /></label>
              <label>Niveau de contenu<select value={maturityLevel} onChange={(event) => setMaturityLevel(event.target.value)}><option value="all">Tous les contenus</option><option value="teen">Adolescents</option><option value="kids">Enfants</option></select></label>
              <label>Langue<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="fr">Français</option><option value="en">English</option></select></label>
              {formError ? <p className="formError" role="alert">{formError}</p> : null}
              <div className="profileEditorActions"><button className="primaryButton" type="submit" disabled={saving || !name.trim()}>{saving ? <Loader2 className="spin" size={18} /> : null}{saving ? "Enregistrement…" : "Enregistrer"}</button>{editedProfile ? <button className="dangerButton" type="button" onClick={() => void removeProfile(editedProfile)} disabled={saving || profiles.length <= 1}><Trash2 size={17} />Supprimer</button> : null}</div>
            </form>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
