import { HomeDashboard } from "@/app/(app)/inicio/home-dashboard";
import { requireActor } from "@/server/auth/request";

export default async function HomePage() {
  const actor = await requireActor();
  return <HomeDashboard name={actor.displayName} />;
}
