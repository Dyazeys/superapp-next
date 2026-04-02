import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
};

export function PageHeader({ eyebrow, title, description, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">{eyebrow}</Badge>
        {meta ? <span className="text-sm text-muted-foreground">{meta}</span> : null}
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
