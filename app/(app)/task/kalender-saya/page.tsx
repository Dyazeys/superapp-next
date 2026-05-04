import { requireTaskAccess } from "@/lib/team-access";
import { TaskMyCalendarWorkspace } from "@/features/task/my-calendar-workspace";

export default async function TaskMyCalendarPage() {
  await requireTaskAccess();

  return <TaskMyCalendarWorkspace />;
}