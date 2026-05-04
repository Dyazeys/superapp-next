import { requireTaskAccess } from "@/lib/team-access";
import { TaskRoutineWorkspace } from "@/features/task/routine-workspace";

export default async function TaskRutinitasPage() {
  await requireTaskAccess();

  return <TaskRoutineWorkspace />;
}
