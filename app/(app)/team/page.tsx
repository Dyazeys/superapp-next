import { CalendarDays, CheckCheck, FileText, Megaphone, Presentation, Route, ShieldCheck, UserRound } from "lucide-react";
import { PageShell } from "@/components/foundation/page-shell";
import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { ModuleHub } from "@/features/shared/module-hub";
import { requireTeamAccess } from "@/lib/team-access";

export default async function TeamPage() {
  await requireTeamAccess();

  return (
    <PageShell
      eyebrow="Team"
      title="Team overview"
      description="Overview ini berfungsi seperti README operasional: menjelaskan isi workspace Team, fungsi tiap area bersama, dan bagaimana tim sebaiknya memakainya."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <WorkspacePanel title="Apa isi modul ini?" description="Team dipakai untuk koordinasi bersama dan kontrol akses aplikasi.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Workspace ini menampung area yang sifatnya kolektif: meeting, kalender tim, pengumuman, approval, struktur tim, SOP, serta admin user dan permission aplikasi.</p>
            <p>Tujuannya menjaga koordinasi tim dan kontrol akses tetap rapi tanpa bercampur dengan workspace personal masing-masing user.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Cara pakai" description="Urutan pakai yang paling enak untuk koordinasi tim dan admin internal.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Gunakan Meeting, Kalender Tim, dan Pengumuman saat tim perlu menjaga sinkronisasi, jadwal bersama, dan penyebaran informasi operasional.</p>
            <p>Masuk ke Approval, Struktur Tim, SOP, atau Team Admin saat kebutuhan mulai menyentuh alur keputusan, struktur organisasi, pedoman kerja, dan keamanan akses.</p>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Prinsip struktur" description="Pemisahan menu dibuat agar kerja personal dan kontrol akses tidak saling mengganggu.">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>Kebutuhan pribadi seperti Tugas Saya, KPI, dan Absensi sekarang dipisahkan ke menu Task agar ritme kerja user terasa lebih fokus.</p>
            <p>Menu Team sengaja disisakan untuk kebutuhan bersama: sinkronisasi tim, dokumentasi rapat, dan keamanan akses aplikasi.</p>
          </div>
        </WorkspacePanel>
      </div>

      <ModuleHub
        summaryTitle="Submenu utama"
        summaryDescription="Workspace Team sekarang berisi area koordinasi, dokumentasi, dan governance yang dipakai bersama."
        bullets={[
          "Meeting dipakai untuk notulen dan tindak lanjut hasil diskusi tim.",
          "Kalender Tim dan Pengumuman dipakai untuk menjaga ritme komunikasi bersama.",
          "Approval, Struktur Tim, dan SOP dipakai untuk alur keputusan, kejelasan peran, dan panduan kerja.",
          "Team Admin dipakai untuk user management dan kontrol permission aplikasi.",
        ]}
        items={[
          {
            title: "Meeting",
            description: "Area agenda, notulen, dan to do hasil rapat agar diskusi tidak berhenti di meeting saja.",
            href: "/team/meeting",
            icon: Presentation,
          },
          {
            title: "Users",
            description: "Area pengelolaan akun login internal yang boleh masuk ke aplikasi.",
            href: "/team/users",
            icon: UserRound,
          },
          {
            title: "Kalender Tim",
            description: "Area jadwal bersama untuk meeting, agenda lintas divisi, deadline tim, dan event operasional.",
            href: "/team/kalender-tim",
            icon: CalendarDays,
          },
          {
            title: "Pengumuman",
            description: "Area komunikasi internal untuk info penting, perubahan SOP, arahan leader, dan update operasional.",
            href: "/team/pengumuman",
            icon: Megaphone,
          },
          {
            title: "Approval",
            description: "Area persetujuan untuk izin, kebutuhan administratif, dan alur keputusan internal yang perlu jejak jelas.",
            href: "/team/approval",
            icon: CheckCheck,
          },
          {
            title: "Struktur Tim",
            description: "Area struktur organisasi untuk melihat divisi, jabatan, reporting line, dan susunan anggota tim.",
            href: "/team/struktur-tim",
            icon: Route,
          },
          {
            title: "SOP",
            description: "Area panduan kerja dan dokumentasi operasional supaya standar proses mudah ditemukan dan dipakai ulang.",
            href: "/team/sop",
            icon: FileText,
          },
          {
            title: "Roles & Permissions",
            description: "Area pengaturan role dan daftar permission yang dipakai untuk guard UI dan API.",
            href: "/team/roles",
            icon: ShieldCheck,
          },
        ]}
      />
    </PageShell>
  );
}
