import { requireTaskAccess } from "@/lib/team-access";
import { TaskTodoKanbanWorkspace } from "@/features/task/todo-workspace";

export default async function TaskMyTasksTodoPage() {
  await requireTaskAccess();
  return <TaskTodoKanbanWorkspace />;
}