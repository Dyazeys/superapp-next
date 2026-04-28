import { WorkspacePanel } from "@/components/foundation/workspace-panel";
import { SelectNative } from "@/components/ui/select-native";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildMonthOptions(year = 2026) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(year, index, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);

    return { value, label };
  });
}

function PlaceholderRow({
  category,
  accountHint,
}: {
  category: string;
  accountHint: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.8fr))] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm">
      <div>
        <p className="font-medium text-slate-900">{category}</p>
        <p className="text-xs text-slate-500">{accountHint}</p>
      </div>
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center text-slate-400">Budget</div>
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center text-slate-400">Realisasi</div>
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center text-slate-400">Variance</div>
    </div>
  );
}

export default function DashboardBudgetMetersPage() {
  const monthOptions = buildMonthOptions(2026);

  return (
    <div className="space-y-6">
      <WorkspacePanel
        title="Filter Budget"
        description="Pilih bulan kerja untuk melihat budget dan realisasi beban."
        titleClassName="text-2xl leading-none"
        descriptionClassName="text-xs leading-5"
      >
        <form className="grid gap-3 md:grid-cols-[220px_auto]">
          <SelectNative name="month" defaultValue="2026-04">
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </SelectNative>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Tampilkan meter
          </button>
        </form>
      </WorkspacePanel>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <WorkspacePanel
          title="Budget vs Realisasi"
          description="Struktur awal untuk membandingkan pagu beban dengan pengeluaran aktual per kelompok biaya."
          titleClassName="text-lg"
          descriptionClassName="text-xs leading-5"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.8fr))] gap-3 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Kategori beban</span>
              <span className="text-center">Budget</span>
              <span className="text-center">Realisasi</span>
              <span className="text-center">Variance</span>
            </div>
            <PlaceholderRow category="Marketing" accountHint="Siapkan mapping akun 611xx atau kelompok campaign." />
            <PlaceholderRow category="Operasional" accountHint="Cocok untuk akun 621xx dan biaya rutin bulanan." />
            <PlaceholderRow category="Lain-lain" accountHint="Cadangan untuk beban tambahan di luar struktur utama." />
          </div>
        </WorkspacePanel>

        <div className="space-y-6">
          <WorkspacePanel
            title="Catatan Setup"
            description="Halaman ini masih template awal, jadi fokusnya baru menyiapkan slot tampilan budget meter."
            titleClassName="text-lg"
            descriptionClassName="text-xs leading-5"
          >
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                Budget source belum ditentukan, jadi kolom nilai masih placeholder.
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                Realisasi nanti paling natural diambil dari transaksi opex dan jurnal beban yang sudah `POSTED`.
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                Begitu kamu share format finalnya, kita bisa ubah susunan ini jadi tabel, meter bar, atau ringkasan per akun.
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Status Meter"
            description="Placeholder untuk indikator pemakaian budget."
            titleClassName="text-lg"
            descriptionClassName="text-xs leading-5"
          >
            <div className="rounded-[24px] bg-slate-900 px-5 py-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Coming Soon</p>
              <p className="mt-2 text-xl font-semibold">Budget utilization meter akan kita bentuk setelah format final dibagikan.</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Untuk sekarang submenu dan layout dasarnya sudah siap, jadi nanti kita tinggal masukin rumus, akun, dan visual yang pas.
              </p>
            </div>
          </WorkspacePanel>
        </div>
      </section>
    </div>
  );
}
