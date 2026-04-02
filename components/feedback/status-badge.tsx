import { Badge } from "@/components/ui/badge";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneMap: Record<StatusTone, string> = {
  neutral: "outline",
  success: "secondary",
  warning: "outline",
  danger: "destructive",
  info: "default",
};

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return <Badge variant={toneMap[tone] as "default" | "secondary" | "destructive" | "outline"}>{label}</Badge>;
}
