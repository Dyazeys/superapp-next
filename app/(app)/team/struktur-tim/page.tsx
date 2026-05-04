import { requireTeamAccess } from "@/lib/team-access";
import { TeamStructureWorkspace } from "@/features/team/structure-workspace";

export default async function TeamStructurePage() {
  await requireTeamAccess();

  return <TeamStructureWorkspace />;
}