import { PageHeader } from "@/components/ui/page-header";
import { ActivityEditor } from "@/components/events/activity-editor";
import { requireActor } from "@/server/auth/request";

export default async function NewActivityPage() {
  const actor = await requireActor();
  const canCreate = actor.role === "admin";
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader title="Nueva actividad" />
      <ActivityEditor locked={!canCreate} />
    </div>
  );
}
