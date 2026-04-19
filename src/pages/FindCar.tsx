import { Navigate } from "react-router-dom";
import { Car, Clock, MapPin, Pin, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PhoneShell } from "@/components/PhoneShell";
import { appStore, useAppState } from "@/lib/app-store";
import { PARKING_LOTS } from "@/lib/mock-data";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function FindCarPage() {
  const user = useAppState((s) => s.user);
  const savedCar = useAppState((s) => s.savedCar);
  const { t } = useTranslation();

  if (!user) return <Navigate to="/" replace />;

  const lot = savedCar ? PARKING_LOTS.find((l) => l.id === savedCar.lotId) : null;
  const minutesAgo = savedCar ? Math.max(1, Math.round((Date.now() - savedCar.savedAt) / 60000)) : 0;
  const lotName = lot ? t(`lots.${lot.id}`, { defaultValue: lot.name }) : "";

  const saveSpot = () => {
    const eligible = PARKING_LOTS.filter((l) => l.eligibleFor.includes(user.type));
    const lot = eligible[Math.floor(Math.random() * eligible.length)];
    appStore.set({
      savedCar: {
        lotId: lot.id,
        slotLabel: `Slot ${String(Math.floor(Math.random() * lot.total)).padStart(2, "0")}`,
        savedAt: Date.now(),
      },
    });
  };

  return (
    <PhoneShell>
      <div className="px-5 pt-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">{t("findCar.kicker")}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("findCar.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {savedCar && lot ? (
          <div className="mt-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl gradient-hero p-6 text-primary-foreground shadow-elevated">
              <div className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">{t("findCar.carAt")}</p>
                  <p className="text-lg font-bold">{lotName}</p>
                </div>
              </div>
              <p className="mt-4 text-sm opacity-90">{savedCar.slotLabel}</p>
              <div className="mt-4 flex items-center gap-4 text-xs opacity-90">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t("findCar.ago", { n: minutesAgo })}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {lot.distanceM} {t("common.m")} · {t("common.minWalk", { n: lot.walkingMin })}</span>
              </div>
            </div>

            <div className="glass shadow-soft mt-4 rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("findCar.route")}</p>
              <div className="mt-3 flex items-center gap-3">
                <Dot label={t("findCar.you")} tone="primary" />
                <Path />
                <Dot label={t("findCar.car")} tone="success" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t("findCar.estWalk", { n: lot.walkingMin })}</p>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110">
                <MapPin className="h-4 w-4" /> {t("findCar.locate")}
              </button>
              <button
                onClick={() => appStore.set({ savedCar: null })}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-muted-foreground transition-smooth hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> {t("findCar.clear")}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 animate-fade-in">
            <div className="glass shadow-soft rounded-3xl p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                <Pin className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{t("findCar.emptyTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("findCar.emptyBody")}</p>
              <button
                onClick={saveSpot}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
              >
                <Pin className="h-4 w-4" /> {t("findCar.save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}

function Dot({ label, tone }: { label: string; tone: "primary" | "success" }) {
  const cls = tone === "primary" ? "bg-primary" : "bg-success";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`relative h-4 w-4 rounded-full ${cls}`}>
        <span className="dot-pulse absolute inset-0 rounded-full" />
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function Path() {
  return (
    <div className="flex-1">
      <svg viewBox="0 0 200 20" className="h-5 w-full">
        <defs>
          <linearGradient id="pathGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--success))" />
          </linearGradient>
        </defs>
        <path
          d="M0 10 Q 50 -10 100 10 T 200 10"
          stroke="url(#pathGrad)"
          strokeWidth="3"
          strokeDasharray="6 6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
