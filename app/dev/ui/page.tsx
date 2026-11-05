import { notFound } from "next/navigation";
import { UiCatalog } from "./UiCatalog";

export const dynamic = "force-dynamic";

export default function UiPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <UiCatalog />;
}
