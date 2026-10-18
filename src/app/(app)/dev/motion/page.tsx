import { ShieldOff } from "lucide-react";
import { MotionLab } from "@/app/(app)/dev/motion/motion-lab";
import { EmptyState } from "@/components/ui/empty-state";
import { requireActor } from "@/server/auth/request";

/** A page to see every animation side by side before approving it. */
export default async function DevMotionPage() {
  const actor = await requireActor();
  if (actor.role !== "admin")
    return (
      <EmptyState
        icon={<ShieldOff size={20} aria-hidden />}
        title="No tiene permiso para ver esta pantalla."
      />
    );
  return <MotionLab />;
}
