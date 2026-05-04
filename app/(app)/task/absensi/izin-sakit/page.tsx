import { requireTaskAccess } from "@/lib/team-access";
import { TaskLeaveRequestWorkspace } from "@/features/task/leave-request-workspace";

export default async function TaskAttendanceLeavePage() {
  await requireTaskAccess();

  return <TaskLeaveRequestWorkspace />;
}