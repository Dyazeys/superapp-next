import { requireTeamAccess } from "@/lib/team-access";
import { TeamApprovalLeaderWorkspace } from "@/features/team/approval-leader-workspace";

export default async function TeamApprovalLeaderPage() {
  await requireTeamAccess();

  return <TeamApprovalLeaderWorkspace />;
}
