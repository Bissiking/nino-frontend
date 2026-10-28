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
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"])
]);
