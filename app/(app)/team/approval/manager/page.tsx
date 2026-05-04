import { requireTeamAccess } from "@/lib/team-access";
import { TeamApprovalManagerWorkspace } from "@/features/team/approval-manager-workspace";

export default async function TeamApprovalManagerPage() {
  await requireTeamAccess();

  return <TeamApprovalManagerWorkspace />;
}
