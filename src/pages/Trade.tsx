import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Clock, MapPin, ShoppingBag, Sparkles, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PhoneShell } from "@/components/PhoneShell";
import { useAppState, appStore } from "@/lib/app-store";
import { TRADE_LISTINGS, type TradeListing } from "@/lib/mock-data";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function TradePage() {
  const user = useAppState((s) => s.user);
  const credits = useAppState((s) => s.credits);
  const { t } = useTranslation();
  const [selected, setSelected] = useState<TradeListing | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  if (!user) return <Navigate to="/" replace />;

  const reserve = (listing: TradeListing) => {
    if (credits < listing.priceCredits) return;
    appStore.set({ credits: credits - listing.priceCredits });
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
            {t("trade.listingsCount", { n: TRADE_LISTINGS.length })}
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {TRADE_LISTINGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelected(l)}
              className="glass shadow-soft flex w-full items-center gap-3 rounded-2xl p-3 text-start transition-smooth hover:border-primary/40 hover:shadow-glow"
            >
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
                <p className="text-base font-bold text-primary">{l.priceCredits}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("common.credits")}</p>
              </div>
            </button>
          ))}
        </div>

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
