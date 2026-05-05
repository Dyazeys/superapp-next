import { requireTeamAccess } from "@/lib/team-access";
import { TeamMeetingNotesWorkspace } from "@/features/team/meeting-notes-workspace";

export default async function TeamMeetingPage() {
  await requireTeamAccess();

  return <TeamMeetingNotesWorkspace />;
}
