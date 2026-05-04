import { requireTeamAccess } from "@/lib/team-access";
import { TeamAnnouncementWorkspace } from "@/features/team/announcement-workspace";

export default async function TeamAnnouncementPage() {
  await requireTeamAccess();

  return <TeamAnnouncementWorkspace />;
}