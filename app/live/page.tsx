import { CatalogPage } from "@/components/CatalogPage";

export default function LivePage() {
  return <CatalogPage kind="live" title="Direct" description="Les émissions actuellement proposées en direct sur Nino." emptyMessage="Aucun direct n’est programmé pour le moment." />;
}
