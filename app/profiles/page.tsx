"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        <div className="brand large">
          <span className="brandMark">N</span>
          <span>Nino</span>
        </div>
        <h1>Choisir un profil</h1>
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

