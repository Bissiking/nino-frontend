"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { saveTokens } from "@/lib/session";
import type { AuthConfig } from "@/types/nino";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setError(null);
    try {
      setConfig(await api.authConfig());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les options de connexion.");
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function startSso() {
    setSsoLoading(true);
    setError(null);
    try {
      const { authorize_url: authorizeUrl } = await api.startSso();
      window.location.assign(authorizeUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La connexion Kyros n’a pas pu démarrer.");
      setSsoLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setError(null);
    try {
      const tokens = await api.login(identifier.trim(), password);
      saveTokens(tokens.access_token, tokens.refresh_token);
      router.push("/profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <main className="authScreen">
      <section className="authPanel" aria-busy={configLoading || passwordLoading || ssoLoading}>
        <div className="authBrand"><Image src="/logo_nino.png" alt="Nino" width={139} height={53} priority /></div>
        <div className="authIntro"><h1>Bon retour sur Nino</h1><p>Connectez-vous pour retrouver vos programmes et votre profil.</p></div>
        {config?.sso_enabled ? (
          <button className="primaryButton wide" type="button" onClick={startSso} disabled={ssoLoading || passwordLoading || configLoading}>
            <ShieldCheck size={19} aria-hidden="true" />
            {ssoLoading ? "Redirection vers Kyros…" : "Continuer avec Kyros"}
          </button>
        ) : null}
        {config?.sso_enabled && config.password_enabled ? <div className="authDivider"><span>ou</span></div> : null}
        {config?.password_enabled ? (
          <form className="authForm" onSubmit={submit}>
            <label>
              Nom d’utilisateur
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={255}
                required
              />
            </label>
            <label>
              Mot de passe
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
            </label>
            <button className="secondaryButton wide" type="submit" disabled={passwordLoading || ssoLoading}>
              {passwordLoading ? <KeyRound size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
              {passwordLoading ? "Vérification…" : "Se connecter avec un mot de passe"}
            </button>
          </form>
        ) : null}
        {error ? <p className="formError" role="alert">{error}</p> : null}
        {error && !config ? <button className="secondaryButton wide" type="button" onClick={loadConfig} disabled={configLoading}>Réessayer</button> : null}
        {configLoading ? <p className="authStatus" role="status">Chargement des options de connexion…</p> : null}
      </section>
    </main>
  );
}
