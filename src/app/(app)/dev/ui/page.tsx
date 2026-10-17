import { DevCatalog } from "@/app/(app)/dev/ui/dev-catalog";
import { requireActor } from "@/server/auth/request";

export default async function DevUiPage() {
  const actor = await requireActor();
  if (actor.role !== "admin")
    return <p>No tiene permiso para ver esta pantalla.</p>;
  return <DevCatalog />;
}
