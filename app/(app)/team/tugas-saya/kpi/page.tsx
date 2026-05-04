import { requireTeamAccess } from "@/lib/team-access";
import { TeamKpiWorkspace } from "@/features/team/team-kpi-workspace";

export default async function TeamKpiPage() {
  await requireTeamAccess();

  return <TeamKpiWorkspace />;
}
