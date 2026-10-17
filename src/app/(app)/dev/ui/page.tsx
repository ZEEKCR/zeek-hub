import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DevCatalog } from "@/app/(app)/dev/ui/dev-catalog";
import { requireActor } from "@/server/auth/request";

export default async function DevUiPage() {
  const actor = await requireActor();
  if (actor.role !== "admin")
    return (
      <EmptyState
        icon={<ShieldOff size={20} aria-hidden />}
        title="No tiene permiso para ver esta pantalla."
      />
    );
  return <DevCatalog />;
}
