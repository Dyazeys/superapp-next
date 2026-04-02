import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WorkspacePanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function WorkspacePanel({ title, description, children }: WorkspacePanelProps) {
  return (
    <Card className="bg-card/90">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
