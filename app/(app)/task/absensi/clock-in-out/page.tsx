import { requireTaskAccess } from "@/lib/team-access";
import { TaskClockInOutWorkspace } from "@/features/task/clock-in-out-workspace";

export default async function TaskAttendanceClockInOutPage() {
  await requireTaskAccess();

  return <TaskClockInOutWorkspace />;
}