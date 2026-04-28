import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WorkspacePanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function WorkspacePanel({
  title,
  description,
  children,
  className,
  titleClassName,
  descriptionClassName,
}: WorkspacePanelProps) {
  return (
    <Card className={cn("bg-white/90", className)}>
      <CardHeader className="border-b border-slate-200/80 pb-4">
        <CardTitle className={cn("text-slate-900", titleClassName)}>{title}</CardTitle>
        {description ? (
          <CardDescription className={cn("text-slate-600", descriptionClassName)}>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}
