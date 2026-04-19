import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Clock, MapPin, ShoppingBag, Sparkles, Wallet, Lock, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PhoneShell } from "@/components/PhoneShell";
import { useAppState, appStore } from "@/lib/app-store";
import { TRADE_LISTINGS, PARKING_LOTS, type TradeListing } from "@/lib/mock-data";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { notificationsStore } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

export default function TradePage() {
  const user = useAppState((s) => s.user);
  const credits = useAppState((s) => s.credits);
  const reservedListingIds = useAppState((s) => s.reservedListingIds);
  const { t } = useTranslation();
  const [selected, setSelected] = useState<TradeListing | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [showIneligible, setShowIneligible] = useState(false);

  const { eligibleListings, ineligibleListings } = useMemo(() => {
    if (!user) return { eligibleListings: [] as TradeListing[], ineligibleListings: [] as TradeListing[] };
    const eligibleLotIds = new Set(
      PARKING_LOTS.filter((l) => !l.prohibited && l.eligibleFor.includes(user.type)).map((l) => l.id),
    );
    return {
      eligibleListings: TRADE_LISTINGS.filter((l) => eligibleLotIds.has(l.lotId)),
      ineligibleListings: TRADE_LISTINGS.filter((l) => !eligibleLotIds.has(l.lotId)),
    };
  }, [user]);

  if (!user) return <Navigate to="/" replace />;

  const isReserved = (id: string) => reservedListingIds.includes(id);

  const reserve = (listing: TradeListing) => {
    if (credits < listing.priceCredits) return;
    if (isReserved(listing.id)) return;
    appStore.set({
      credits: credits - listing.priceCredits,
      reservedListingIds: [...reservedListingIds, listing.id],
    });
    notificationsStore.add({
      type: "trade",
      title: t("notifications.spotReserved"),
      body: t("notifications.spotReservedBody", {
        lot: listing.lot,
        from: listing.windowStart,
        to: listing.windowEnd,
      }),
      lotId: listing.lotId,
    });
    setConfirmed(listing.id);
    setSelected(null);
    setTimeout(() => setConfirmed(null), 2400);
  };

  return (
    <PhoneShell>
      <div className="px-5 pt-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">{t("trade.kicker")}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("trade.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-5 overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-elevated animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 opacity-80" />
              <span className="text-xs uppercase tracking-wider opacity-80">{t("trade.wallet")}</span>
            </div>
            <button className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur transition-smooth hover:bg-white/25">
              {t("common.topUp")}
            </button>
          </div>
          <p className="mt-3 text-4xl font-bold tracking-tight">
            {credits} <span className="text-sm font-medium opacity-80">{t("common.credits")}</span>
          </p>
          <p className="mt-1 text-xs opacity-75">{t("trade.walletHint")}</p>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-sm font-semibold">{t("trade.availableNow")}</h2>
          <span className="ms-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("trade.listingsCount", { n: eligibleListings.length })}
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {eligibleListings.map((l) => {
            const reserved = isReserved(l.id);
            return (
              <div key={l.id} className="relative">
                <button
                  onClick={() => !reserved && setSelected(l)}
                  disabled={reserved}
                  className={cn(
                    "glass shadow-soft relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 text-start transition-smooth",
                    reserved
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:border-primary/40 hover:shadow-glow",
                  )}
                >
                  {/* Reserved ribbon (rotated 45°, top-end corner) */}
                  {reserved && (
                    <div
                      className="pointer-events-none absolute top-3 -end-8 z-10 rotate-45 gradient-success px-8 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success-foreground shadow-soft"
                      aria-hidden="true"
                    >
                      {t("trade.reserved")}
                    </div>
                  )}

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{l.lot}</p>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {t(`ownerType.${l.ownerType}`)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("trade.by")} {l.ownerName}</p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{l.windowStart} – {l.windowEnd}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.distanceM} {t("common.m")}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    {reserved ? (
                      <p className="text-[11px] font-medium text-muted-foreground">{t("trade.alreadyReserved")}</p>
                    ) : (
                      <>
                        <p className="text-base font-bold text-primary">{l.priceCredits}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("common.credits")}</p>
                      </>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Ineligible listings (collapsed by default) */}
        {ineligibleListings.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowIneligible((v) => !v)}
              className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:bg-muted"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{t("trade.notForPermit")}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{ineligibleListings.length}</span>
              <span className="ms-auto">
                {showIneligible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            </button>
            {showIneligible && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {ineligibleListings.map((l) => (
                  <div
                    key={l.id}
                    className="glass shadow-soft flex items-center gap-3 rounded-2xl p-3 opacity-60"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-muted-foreground">{l.lot}</p>
                      <p className="text-[11px] text-muted-foreground">{t("trade.notEligibleNote")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {confirmed && (
          <div className="fixed inset-x-0 bottom-28 z-50 mx-auto flex max-w-md justify-center px-4 animate-slide-up">
            <div className="gradient-success shadow-elevated rounded-2xl px-4 py-3 text-sm font-medium text-success-foreground">
              {t("trade.success")}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            aria-label={t("common.cancel")}
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
          />
          <div className="relative z-10 w-full max-w-md p-4 animate-slide-up">
            <div className="glass-strong shadow-elevated rounded-3xl p-5">
              <p className="text-xs uppercase tracking-wider text-primary">{t("trade.confirmTitle")}</p>
              <h3 className="mt-1 text-lg font-semibold">{selected.lot}</h3>
              <p className="text-xs text-muted-foreground">
                {t(`ownerType.${selected.ownerType}`)} · {selected.ownerName}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label={t("trade.window")} value={`${selected.windowStart}–${selected.windowEnd}`} />
                <Stat label={t("trade.distance")} value={`${selected.distanceM} ${t("common.m")}`} />
                <Stat label={t("trade.cost")} value={`${selected.priceCredits} ${t("common.cr")}`} />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs">
                <span className="text-muted-foreground">{t("trade.walletAfter")}</span>
                <span className="font-semibold">{credits - selected.priceCredits} {t("common.credits")}</span>
              </div>

              {isReserved(selected.id) ? (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground dark:text-warning">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{t("trade.alreadyReservedWarning")}</span>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-smooth hover:bg-muted"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    disabled={credits < selected.priceCredits}
                    onClick={() => reserve(selected)}
                    className="flex-[1.5] rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:opacity-40"
                  >
                    {t("trade.reserveFor", { n: selected.priceCredits })}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-2">
      <p className="text-xs font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
