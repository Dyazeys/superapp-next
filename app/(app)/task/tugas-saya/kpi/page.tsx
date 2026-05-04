import { requireTaskAccess } from "@/lib/team-access";
import { TaskKpiWorkspace } from "@/features/task/kpi-workspace";

export default async function TaskMyTasksKpiPage() {
  await requireTaskAccess();

  return <TaskKpiWorkspace />;
}