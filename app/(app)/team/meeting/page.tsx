import { BookOpenText, ClipboardList, Presentation } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { ModuleHub } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamMeetingPage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="Meeting"
      description="Overview awal untuk agenda meeting, catatan sinkronisasi, dan tindak lanjut hasil rapat."
    >
      <ModuleHub
        summaryTitle="Fungsi utama"
        summaryDescription="Area ini dipakai untuk menjaga hasil diskusi tim tidak berhenti di meeting saja."
        bullets={[
          "Meeting akan dipakai untuk agenda, notulen, keputusan, dan alignment tim.",
          "Notulen akan dipakai untuk menangkap catatan rapat dengan istilah yang memang sudah familier dipakai tim.",
          "To Do akan dipakai untuk menerjemahkan hasil meeting menjadi action item yang jelas dan terukur.",
        ]}
        items={[
          {
            title: "Meeting Overview",
            description: "Slot untuk jadwal meeting, peserta, agenda, keputusan, dan dokumentasi hasil rapat.",
            href: "/team/meeting",
            icon: Presentation,
          },
          {
            title: "Notulen",
            description: "Tempat catatan meeting, rangkuman pembahasan, keputusan, dan poin penting hasil diskusi.",
            href: "/team/meeting/notulen",
            icon: BookOpenText,
          },
          {
            title: "To Do",
            description: "Tempat action items hasil meeting, PIC, deadline, dan status tindak lanjut.",
            href: "/team/meeting/to-do",
            icon: ClipboardList,
          },
        ]}
      />
    </PageShell>
  );
}
