import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-primary-soft text-primary",
  warning: "bg-warning/25 text-warning-foreground",
  success: "bg-success/15 text-success",
  danger: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", TONES[tone], className)}>
      {label}
    </span>
  );
}
