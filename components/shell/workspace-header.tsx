import { Bell, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WorkspaceHeaderProps = {
  title: string;
  description: string;
};

export function WorkspaceHeader({ title, description }: WorkspaceHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 md:w-[320px]">
          <Search className="size-4 text-muted-foreground" />
          <Input
            readOnly
            value="Search navigation, commands, or docs"
            className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="size-4" />
            Alerts
          </Button>
          <Button variant="outline" size="sm">
            <Settings2 className="size-4" />
            Configure
          </Button>
        </div>
      </div>
    </header>
  );
}
