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
    <Card className="border-slate-200 bg-card/90">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/30 px-3 py-1 text-xs font-medium text-accent-foreground">
            <ArrowUpRight className="size-3" />
            {trend}
          </div>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
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
};

export function MetricCard({ title, value, subtitle, icon, className }: MetricCardProps) {
  return (
    <Card size="sm" className={cn("border-l-4 border-l-slate-300 bg-card/90", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle ? <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p> : null}
        </div>
        {icon ? <div className="rounded-xl bg-muted/50 p-2 text-foreground/80">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
