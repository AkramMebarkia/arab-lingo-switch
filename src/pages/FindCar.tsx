import { Navigate } from "react-router-dom";
import { Car, Clock, MapPin, Navigation, Trash2 } from "lucide-react";
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
    const eligible = PARKING_LOTS.filter((l) => !l.prohibited && l.eligibleFor.includes(user.type));
    if (eligible.length === 0) return;
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    appStore.set({
      savedCar: {
        lotId: pick.id,
        slotLabel: `Slot ${String(Math.max(1, Math.floor(Math.random() * pick.total))).padStart(2, "0")}`,
        savedAt: Date.now(),
      },
    });
  };

  const openInMaps = () => {
    if (!lot) return;
    const [lng, lat] = lot.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, "_blank", "noopener,noreferrer");
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
          <div className="mt-4 flex flex-col gap-4 animate-fade-in">
            {/* Radar animation */}
            <RadarSection />

            {/* Frosted info card */}
            <div className="glass-strong shadow-elevated rounded-3xl p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                  <Car className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("findCar.carAt")}</p>
                  <p className="truncate text-xl font-bold">{lotName}</p>
                  <p className="text-sm text-muted-foreground">{savedCar.slotLabel}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {lot.distanceM} {t("common.m")}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {t("common.minWalk", { n: lot.walkingMin })}
                </span>
                <span className="ms-auto rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-semibold text-success">
                  {t("findCar.savedAgo", { n: minutesAgo })}
                </span>
              </div>
            </div>

            {/* Animated route line */}
            <RouteLine walkMin={lot.walkingMin} />

            {/* Action buttons */}
            <button
              onClick={openInMaps}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
            >
              <Navigation className="h-4 w-4" /> {t("findCar.openInMaps")}
            </button>
            <button
              onClick={() => appStore.set({ savedCar: null })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-muted-foreground transition-smooth hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> {t("findCar.clear")}
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center text-center animate-fade-in">
            <CarHero />
            <h2 className="mt-6 text-2xl font-bold tracking-tight">{t("findCar.emptyTitle")}</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("findCar.emptyBody")}</p>
            <button
              onClick={saveSpot}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-4 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 animate-scale-in"
            >
              <MapPin className="h-4 w-4" /> {t("findCar.save")}
            </button>
          </div>
        )}
      </div>

      <RadarStyles />
    </PhoneShell>
  );
}

/* ---------- Radar ---------- */

function RadarSection() {
  return (
    <div className="relative h-[260px] w-full overflow-hidden">
      <svg viewBox="0 0 320 260" className="absolute inset-0 h-full w-full">
        {/* Three concentric rings */}
        <circle className="kfupm-radar-ring kfupm-radar-ring-1" cx="160" cy="130" r="40"
          fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <circle className="kfupm-radar-ring kfupm-radar-ring-2" cx="160" cy="130" r="40"
          fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <circle className="kfupm-radar-ring kfupm-radar-ring-3" cx="160" cy="130" r="40"
          fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />

        {/* Static halo */}
        <circle cx="160" cy="130" r="100" fill="hsl(var(--primary) / 0.04)" />
        <circle cx="160" cy="130" r="60" fill="hsl(var(--primary) / 0.06)" />

        {/* YOU dot */}
        <circle cx="160" cy="130" r="6" fill="hsl(var(--primary))" />
        <text x="160" y="155" fontSize="9" fontWeight="700" fill="hsl(var(--muted-foreground))"
          textAnchor="middle" fontFamily="ui-sans-serif, system-ui">YOU</text>

        {/* CAR dot offset */}
        <g className="kfupm-radar-car">
          <circle cx="200" cy="100" r="7" fill="hsl(var(--success))" />
          <text x="200" y="86" fontSize="9" fontWeight="700" fill="hsl(var(--success))"
            textAnchor="middle" fontFamily="ui-sans-serif, system-ui">CAR</text>
        </g>
      </svg>
    </div>
  );
}

function RouteLine({ walkMin }: { walkMin: number }) {
  const { t } = useTranslation();
  return (
    <div className="glass shadow-soft rounded-3xl p-4">
      <div className="flex items-center gap-3">
        <Endpoint label={t("findCar.you")} tone="primary" />
        <div className="relative flex-1">
          <svg viewBox="0 0 200 20" className="h-5 w-full">
            <line
              x1="0" y1="10" x2="200" y2="10"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 6"
              className="kfupm-route-dash"
            />
          </svg>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-primary shadow-soft">
            {t("common.minWalk", { n: walkMin })}
          </span>
        </div>
        <Endpoint label={t("findCar.car")} tone="success" />
      </div>
    </div>
  );
}

function Endpoint({ label, tone }: { label: string; tone: "primary" | "success" }) {
  const cls = tone === "primary" ? "bg-primary" : "bg-success";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`relative h-3.5 w-3.5 rounded-full ${cls}`}>
        <span className="dot-pulse absolute inset-0 rounded-full" />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function CarHero() {
  return (
    <div className="relative h-[200px] w-[200px]">
      {/* Rotating dashed circles */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full kfupm-rotate-slow">
        <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(var(--primary) / 0.35)" strokeWidth="1.5" strokeDasharray="6 8" />
      </svg>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full kfupm-rotate-fast">
        <circle cx="100" cy="100" r="68" fill="none" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1.5" strokeDasharray="4 10" />
      </svg>
      {/* Car silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 120 60" className="h-20 w-20 text-primary kfupm-car-bob">
          <path
            d="M10 40 Q12 28 24 24 L40 18 Q52 14 70 14 L88 14 Q102 14 110 28 L114 38 Q116 44 110 46 L100 46 Q98 38 88 38 Q78 38 76 46 L44 46 Q42 38 32 38 Q22 38 20 46 L14 46 Q8 46 10 40 Z"
            fill="currentColor"
          />
          <circle cx="32" cy="46" r="6" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2" />
          <circle cx="88" cy="46" r="6" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

function RadarStyles() {
  return (
    <style>{`
      @keyframes kfupm-radar-pulse {
        0%   { transform: scale(1);   opacity: 0.55; }
        80%  { opacity: 0; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      .kfupm-radar-ring { transform-origin: 160px 130px; transform-box: fill-box; }
      .kfupm-radar-ring-1 { animation: kfupm-radar-pulse 2s ease-out infinite; opacity: 0.5; }
      .kfupm-radar-ring-2 { animation: kfupm-radar-pulse 2s ease-out infinite 0.6s; opacity: 0.3; }
      .kfupm-radar-ring-3 { animation: kfupm-radar-pulse 2s ease-out infinite 1.2s; opacity: 0.15; }

      @keyframes kfupm-car-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.18); }
      }
      .kfupm-radar-car { transform-origin: 200px 100px; transform-box: fill-box; animation: kfupm-car-pulse 1.6s ease-in-out infinite; }

      @keyframes kfupm-dash-flow {
        from { stroke-dashoffset: 0; }
        to   { stroke-dashoffset: -24; }
      }
      .kfupm-route-dash { animation: kfupm-dash-flow 1.2s linear infinite; }

      @keyframes kfupm-car-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      .kfupm-car-bob { animation: kfupm-car-bob 2s ease-in-out infinite; }

      @keyframes kfupm-spin-cw  { to { transform: rotate(360deg); } }
      @keyframes kfupm-spin-ccw { to { transform: rotate(-360deg); } }
      .kfupm-rotate-slow { animation: kfupm-spin-cw  12s linear infinite; }
      .kfupm-rotate-fast { animation: kfupm-spin-ccw 8s  linear infinite; }
    `}</style>
  );
}
