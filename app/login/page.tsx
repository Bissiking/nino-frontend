"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { saveTokens } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@nino.local");
  const [password, setPassword] = useState("nino-admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokens = await api.login(email, password);
      saveTokens(tokens.access_token, tokens.refresh_token);
      router.push("/profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authScreen">
      <form className="authPanel" onSubmit={submit}>
        <div className="authBrand"><Image src="/logo_nino.png" alt="Nino" width={139} height={53} priority /></div>
        <div className="authIntro"><h1>Bon retour sur Nino</h1><p>Connectez-vous pour retrouver vos programmes et votre profil.</p></div>
        <label>
          Identifiant
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required />
        </label>
        <label>
          Mot de passe
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
        </label>
        {error ? <p className="formError" role="alert">{error}</p> : null}
        <button className="primaryButton wide" type="submit" disabled={loading}>
          {loading ? <KeyRound size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
          {loading ? "Vérification" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
