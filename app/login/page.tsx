import { redirect } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TOP_NAV_ITEMS } from "@/lib/navigation";
import { LoginForm } from "@/components/auth/login-form";

const TOP_NAV_SUMMARY: Record<string, string> = {
  erp: "Pusat proses operasional dan finansial lintas divisi.",
  analytics: "Insight performa marketing untuk memantau kampanye dan pertumbuhan channel.",
  task: "Workspace personal untuk tugas harian, KPI, absensi, dan ritme kerja individu.",
  team: "Ruang koordinasi tim untuk meeting, notulen, tindak lanjut, dan kontrol akses aplikasi.",
  assistant: "Asisten AI untuk tanya jawab cepat seputar penggunaan sistem dan alur kerja.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-4 md:px-6 md:py-6">
      <div className="grid w-full max-w-[1400px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm lg:min-h-[82vh] lg:grid-cols-2">
        <section className="relative flex flex-col p-7 md:p-10 lg:p-12">
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-4 text-slate-900">
                <Image
                  src="/brand/riders-inc-logo-text-black.png"
                  alt="Riders.Inc Motorcycle"
                  width={120}
                  height={120}
                  className="h-auto w-[88px] object-contain md:w-[102px]"
                  priority
                />
                <div className="leading-tight md:pl-1">
                  <p className="text-lg font-semibold">SuperApp</p>
                  <p className="text-xs text-slate-500">Workspace satu pintu.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold text-slate-900">Welcome Back</h1>
                  <p className="text-sm text-slate-500">
                    Masuk untuk mengakses dashboard operasional, modul ERP, dan workspace Team.
                  </p>
                </div>
                <LoginForm />
              </div>

              <div className="space-y-3 lg:hidden">
                <p className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  Main Navigation
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {TOP_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === "erp";
                    const itemStatus = isActive ? "Aktif" : "Segera";

                    return (
                      <div
                        key={`mobile-${item.id}`}
                        className={[
                          "rounded-2xl border p-3.5 shadow-sm shadow-slate-900/5 transition-colors",
                          isActive ? "border-slate-300 bg-white" : "border-slate-200/90 bg-white/80",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "mb-3 h-1 w-14 rounded-full",
                            isActive ? "bg-slate-900" : "bg-slate-300",
                          ].join(" ")}
                        />
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={[
                              "inline-flex size-7 items-center justify-center rounded-lg",
                              isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700",
                            ].join(" ")}
                          >
                            <Icon className="size-3.5" />
                          </span>
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[11px] font-medium",
                              isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
                            ].join(" ")}
                          >
                            {itemStatus}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">{TOP_NAV_SUMMARY[item.id]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-slate-400">
            <p>Copyright &copy; {new Date().getFullYear()} SuperApp</p>
            <p>Privacy Policy</p>
          </div>
        </section>

        <section className="relative hidden border-l border-slate-200/80 bg-[linear-gradient(165deg,#ffffff_0%,#f8fafd_55%,#f3f7fc_100%)] p-8 text-slate-900 lg:flex lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_6%,rgba(148,163,184,0.15),transparent_34%),radial-gradient(circle_at_14%_78%,rgba(30,41,59,0.06),transparent_40%)]" />
          <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col justify-center gap-8">
            <div className="space-y-3">
              <p className="inline-flex w-fit rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                Main Navigation
              </p>
              <h2 className="max-w-md text-4xl leading-tight font-semibold text-slate-900">
                Kelola operasional tim dalam satu workspace.
              </h2>
              <p className="max-w-lg text-sm text-slate-600">
                ERP untuk input dan perapihan data operasional, Analytic untuk visualisasi dan insight, Task untuk
                ritme kerja personal, Team untuk koordinasi dan akses aplikasi, serta AI Assistant untuk tanya-jawab
                cepat seputar sistem.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {TOP_NAV_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = item.id === "erp";
                  const itemStatus = isActive ? "Aktif" : "Segera";
                  const isLastOddCard = TOP_NAV_ITEMS.length % 2 === 1 && index === TOP_NAV_ITEMS.length - 1;

                  return (
                    <div
                      key={item.id}
                      className={[
                        "rounded-2xl border p-3.5 shadow-sm shadow-slate-900/5 transition-colors",
                        isLastOddCard ? "col-span-2" : "",
                        isActive ? "border-slate-300 bg-white" : "border-slate-200/90 bg-white/80",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mb-3 h-1 w-14 rounded-full",
                          isActive ? "bg-slate-900" : "bg-slate-300",
                        ].join(" ")}
                      />
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={[
                            "inline-flex size-7 items-center justify-center rounded-lg",
                            isActive ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700",
                          ].join(" ")}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
                          ].join(" ")}
                        >
                          {itemStatus}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{TOP_NAV_SUMMARY[item.id]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
