import { requireTeamAccess } from "@/lib/team-access";
import { TeamCalendarWorkspace } from "@/features/team/team-calendar-workspace";

export default async function TeamCalendarPage() {
  await requireTeamAccess();

  return <TeamCalendarWorkspace />;
}