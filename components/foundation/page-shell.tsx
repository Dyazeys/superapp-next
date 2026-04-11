import { cn } from "@/lib/utils";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <section className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </section>
      {children}
    </div>
  );
}
