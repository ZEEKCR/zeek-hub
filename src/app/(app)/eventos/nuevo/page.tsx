import { ActivityEditor } from "@/components/events/activity-editor";
import { requireActor } from "@/server/auth/request";

export default async function NewActivityPage() {
  const actor = await requireActor();
  const canCreate = actor.role === "admin";
  return (
    <div className="grid gap-6">
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] leading-none font-semibold">
        Nueva actividad
      </h1>
      <ActivityEditor locked={!canCreate} />
    </div>
  );
}
