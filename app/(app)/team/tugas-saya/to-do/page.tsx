import { requireTeamAccess } from "@/lib/team-access";
import { TeamTodoWorkspace } from "@/features/team/team-todo-workspace";

export default async function TeamMyTasksTodoPage() {
  await requireTeamAccess();
  return <TeamTodoWorkspace />;
}