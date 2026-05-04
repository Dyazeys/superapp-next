import { requireTeamAccess } from "@/lib/team-access";
import { TeamMeetingNotesWorkspace } from "@/features/team/meeting-notes-workspace";

export default async function TeamMeetingNotesPage() {
  await requireTeamAccess();

  return <TeamMeetingNotesWorkspace />;
}