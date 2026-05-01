import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
};

export function StatsCard({ title, value, trend, icon }: StatsCardProps) {
  return (
    <Card className="border-slate-200/80 bg-white/95">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ArrowUpRight className="size-3" />
            {trend}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-slate-700">{icon}</div>
      </CardContent>
    </Card>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  subtitleClassName?: string;
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  className,
  titleClassName,
  valueClassName,
  subtitleClassName,
}: MetricCardProps) {
  return (
    <Card size="sm" className={cn("bg-white/95", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500", titleClassName)}>
            {title}
          </p>
          <p
            className={cn(
              "mt-2 whitespace-nowrap text-[clamp(1.45rem,1.8vw,2rem)] leading-tight font-bold tracking-tight text-foreground",
              valueClassName
            )}
          >
            {value}
          </p>
          {subtitle ? <p className={cn("mt-1 text-xs leading-5 text-slate-600", subtitleClassName)}>{subtitle}</p> : null}
        </div>
        {icon ? <div className="shrink-0 rounded-xl border border-slate-200/70 bg-slate-50 p-2 text-foreground/80">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
