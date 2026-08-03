"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { saveProfileId } from "@/lib/session";
import type { Profile } from "@/types/nino";
import { ErrorState, LoadingState } from "@/components/StateBlock";

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    api.profiles().then(setProfiles).catch((err) => setError(err.message ?? "Profils indisponibles.")).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <main className="profileScreen">
      <div className="profileHeader">
        <Image src="/logo_nino.png" alt="Nino" width={139} height={53} priority />
        <h1>Qui regarde ?</h1>
        <p>Choisissez votre profil pour personnaliser Nino.</p>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      <div className="profileGrid">
        {profiles.map((profile) => (
          <button
            className="profileTile"
            key={profile.id}
            type="button"
            onClick={() => {
              saveProfileId(profile.id);
              router.push("/");
            }}
          >
            <span className="avatarDisc">
              <UserRound size={42} aria-hidden="true" />
            </span>
            <span>{profile.name}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
