import { ArrowRight, Navigation, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ParkingLot } from "@/lib/mock-data";

interface RerouteSheetProps {
  open: boolean;
  fromLot: ParkingLot | null;
  toLot: ParkingLot | null;
  onAccept: () => void;
  onDismiss: () => void;
}

export function RerouteSheet({ open, fromLot, toLot, onAccept, onDismiss }: RerouteSheetProps) {
  const { t } = useTranslation();
  if (!open || !fromLot || !toLot) return null;
  const walkDelta = toLot.walkingMin - fromLot.walkingMin;
  const fromName = t(`lots.${fromLot.id}`, { defaultValue: fromLot.name });
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label={t("common.cancel")}
        onClick={onDismiss}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative z-10 w-full max-w-md p-4 animate-slide-up">
        <div className="glass-strong shadow-elevated overflow-hidden rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                {t("reroute.title")}
              </p>
              <h3 className="text-base font-semibold">{t("reroute.filledUp", { name: fromName })}</h3>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-muted/50 p-3">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">{t("reroute.from")}</p>
              <p className="text-sm font-medium">{fromLot.id}</p>
              <p className="text-xs text-muted-foreground">{t("common.minWalk", { n: fromLot.walkingMin })}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-primary rtl:rotate-180" />
            <div className="text-end">
              <p className="text-[10px] uppercase text-muted-foreground">{t("reroute.bestAlt")}</p>
              <p className="text-sm font-medium">{toLot.id}</p>
              <p className="text-xs text-muted-foreground">{t("common.minWalk", { n: toLot.walkingMin })}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-xs">
            <span className="text-muted-foreground">{t("reroute.delta")}</span>
            <span className="font-semibold text-primary">
              {walkDelta > 0 ? `+${walkDelta} ${t("common.min")}` : `${walkDelta} ${t("common.min")}`}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-smooth hover:bg-muted"
            >
              {t("reroute.keepLooking")}
            </button>
            <button
              onClick={onAccept}
              className="flex-[1.5] flex items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
            >
              <Navigation className="h-4 w-4" /> {t("reroute.navigateTo", { id: toLot.id })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
