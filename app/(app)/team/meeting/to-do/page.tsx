import { requireTeamAccess } from "@/lib/team-access";
import { TeamMeetingTodoWorkspace } from "@/features/team/meeting-todo-workspace";

export default async function TeamMeetingTodoPage() {
  await requireTeamAccess();

  return <TeamMeetingTodoWorkspace />;
}