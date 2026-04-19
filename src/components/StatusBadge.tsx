import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { SlotStatus } from "@/lib/mock-data";

const cls: Record<SlotStatus, { wrap: string; dot: string }> = {
  available: { wrap: "bg-success/15 text-success", dot: "bg-success" },
  limited:   { wrap: "bg-warning/20 text-warning-foreground dark:text-warning", dot: "bg-warning" },
  occupied:  { wrap: "bg-destructive/15 text-destructive", dot: "bg-destructive" },
};

export function StatusBadge({ status, className }: { status: SlotStatus; className?: string }) {
  const { t } = useTranslation();
  const labelKey =
    status === "available" ? "status.available" :
    status === "limited"   ? "status.limited"   : "status.full";
  const m = cls[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        m.wrap, className,
      )}
    >
      <span className={cn("dot-pulse h-1.5 w-1.5 rounded-full", m.dot)} />
      {t(labelKey)}
    </span>
  );
}
