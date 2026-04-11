import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WorkspacePanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function WorkspacePanel({ title, description, children }: WorkspacePanelProps) {
  return (
    <Card className="bg-white/90">
      <CardHeader className="border-b border-slate-200/80 pb-4">
        <CardTitle className="text-slate-900">{title}</CardTitle>
        {description ? <CardDescription className="text-slate-600">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}
