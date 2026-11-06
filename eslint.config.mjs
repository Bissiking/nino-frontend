import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // Existing V8 findings remain visible and bounded by the lint warning budget.
  // New files keep the upstream error severity. Remove exceptions during V9 UI work.
  {
    files: [
      "app/auth/callback/page.tsx",
      "app/flashy/page.tsx",
      "app/login/page.tsx",
      "app/page.tsx",
      "app/profiles/page.tsx",
      "app/search/page.tsx",
      "app/studio/media/[[]id[]]/page.tsx",
      "app/studio/series/page.tsx",
      "app/studio/series/[[]id[]]/page.tsx",
      "app/studio/transcode/page.tsx",
      "app/watch/[[]id[]]/page.tsx",
      "components/CatalogPage.tsx",
      "components/CommentsSection.tsx",
      "components/ProfileMenu.tsx",
      "components/SessionGate.tsx",
      "components/studio/MediaEditor.tsx",
      "components/studio/StudioLibrary.tsx",
      "components/studio/StudioNotifications.tsx",
      "components/studio/StudioShell.tsx",
      "hooks/useStudioData.ts"
    ],
    rules: { "react-hooks/set-state-in-effect": "warn" }
  },
  {
    files: [
      "components/MediaPlayer.tsx",
      "components/studio/StudioLibrary.tsx"
    ],
    rules: { "react-hooks/purity": "warn" }
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    ignores: ["components/icons/**"],
    rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["lucide-react", "lucide-react/*", "@getpapillon/papicons", "@getpapillon/papicons/*", "@tabler/icons-react", "@tabler/icons-react/*", "@phosphor-icons/react", "@phosphor-icons/react/*"], message: "Utilisez le composant Icon de @/components/icons et son registre centralisé." }] }] }
  },
  // Existing provider imports are migrated progressively; no exception for new pages.
  {
    files: [
      "app/auth/callback/page.tsx",
      "app/flashy/page.tsx",
      "app/profiles/page.tsx",
      "app/studio/administration/page.tsx",
      "app/studio/live/page.tsx",
      "app/studio/media/[[]id[]]/page.tsx",
      "app/studio/overview/page.tsx",
      "app/studio/schedule/page.tsx",
      "app/studio/series/[[]id[]]/page.tsx",
      "app/studio/series/page.tsx",
      "app/studio/transcode/page.tsx",
      "app/watch/[[]id[]]/page.tsx",
      "components/CommentsSection.tsx",
      "components/MediaActions.tsx",
      "components/MediaCard.tsx",
      "components/MediaPlayer.tsx",
      "components/ProfileMenu.tsx",
      "components/studio/MediaEditor.tsx",
      "components/studio/StudioLibrary.tsx",
      "components/studio/StudioNotifications.tsx",
      "components/studio/StudioShell.tsx"
],
    rules: { "no-restricted-imports": "off" }
  },
  globalIgnores([".backup/**", ".next/**", "out/**", "build/**", "next-env.d.ts"])
]);
