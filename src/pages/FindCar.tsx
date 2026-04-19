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
      <div className="px-5 pt-6 pb-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">{t("findCar.kicker")}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t("findCar.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {savedCar && lot ? (
          <div className="mt-5 flex flex-col gap-5 animate-fade-in">
            {/* Radar */}
            <Radar walkMin={lot.walkingMin} />

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

/* =========================================================
   Modern radar — pure CSS, no SVG transform-box dependency.
   Three concentric pulse rings, a YOU dot in the centre,
   and an offset CAR pin with a soft halo. Works in light/dark.
   ========================================================= */
function Radar({ walkMin }: { walkMin: number }) {
  const { t } = useTranslation();
  return (
    <div className="relative mx-auto h-[280px] w-full max-w-[360px]">
      {/* base disc */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="kfupm-radar-disc">
          {/* concentric guide rings */}
          <span className="kfupm-radar-guide kfupm-radar-guide-1" />
          <span className="kfupm-radar-guide kfupm-radar-guide-2" />
          <span className="kfupm-radar-guide kfupm-radar-guide-3" />

          {/* sweeping pulse rings */}
          <span className="kfupm-radar-pulse kfupm-radar-pulse-1" />
          <span className="kfupm-radar-pulse kfupm-radar-pulse-2" />
          <span className="kfupm-radar-pulse kfupm-radar-pulse-3" />

          {/* sweeping conic beam */}
          <span className="kfupm-radar-beam" />

          {/* YOU dot in centre */}
          <span className="kfupm-radar-you">
            <span className="kfupm-radar-you-dot" />
          </span>

          {/* CAR pin offset to upper-right */}
          <span className="kfupm-radar-car">
            <span className="kfupm-radar-car-halo" />
            <span className="kfupm-radar-car-dot">
              <Car className="h-3.5 w-3.5 text-success-foreground" />
            </span>
          </span>
        </div>
      </div>

      {/* labels — absolutely positioned overlays */}
      <span className="absolute bottom-2 start-1/2 -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
        {t("findCar.you")}
      </span>
      <span className="absolute end-3 top-3 flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold text-success backdrop-blur">
        <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-success" />
        {t("common.minWalk", { n: walkMin })}
      </span>
    </div>
  );
}

function CarHero() {
  return (
    <div className="relative h-[200px] w-[200px]">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full kfupm-rotate-slow">
        <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(var(--primary) / 0.35)" strokeWidth="1.5" strokeDasharray="6 8" />
      </svg>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full kfupm-rotate-fast">
        <circle cx="100" cy="100" r="68" fill="none" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1.5" strokeDasharray="4 10" />
      </svg>
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

/* All radar visuals via plain CSS keyframes — robust across browsers. */
function RadarStyles() {
  return (
    <style>{`
      .kfupm-radar-disc {
        position: relative;
        width: 280px; height: 280px; border-radius: 9999px;
        background:
          radial-gradient(closest-side, hsl(var(--primary) / 0.10), transparent 70%),
          radial-gradient(closest-side, hsl(var(--primary) / 0.04), transparent 100%);
        overflow: hidden;
      }
      .kfupm-radar-guide {
        position: absolute; left: 50%; top: 50%;
        transform: translate(-50%, -50%);
        border-radius: 9999px;
        border: 1px solid hsl(var(--primary) / 0.18);
      }
      .kfupm-radar-guide-1 { width: 90px;  height: 90px;  }
      .kfupm-radar-guide-2 { width: 170px; height: 170px; }
      .kfupm-radar-guide-3 { width: 250px; height: 250px; }

      @keyframes kfupm-radar-pulse {
        0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0.6; }
        80%  { opacity: 0; }
        100% { transform: translate(-50%, -50%) scale(1);   opacity: 0; }
      }
      .kfupm-radar-pulse {
        position: absolute; left: 50%; top: 50%;
        width: 250px; height: 250px;
        border-radius: 9999px;
        border: 2px solid hsl(var(--primary) / 0.55);
        transform: translate(-50%, -50%) scale(0.2);
        animation: kfupm-radar-pulse 2.4s cubic-bezier(0.16,1,0.3,1) infinite;
      }
      .kfupm-radar-pulse-1 { animation-delay: 0s;   }
      .kfupm-radar-pulse-2 { animation-delay: 0.8s; }
      .kfupm-radar-pulse-3 { animation-delay: 1.6s; }

      @keyframes kfupm-radar-beam {
        from { transform: translate(-50%, -50%) rotate(0deg);   }
        to   { transform: translate(-50%, -50%) rotate(360deg); }
      }
      .kfupm-radar-beam {
        position: absolute; left: 50%; top: 50%;
        width: 250px; height: 250px;
        border-radius: 9999px;
        background: conic-gradient(
          from 0deg,
          hsl(var(--primary) / 0.35) 0deg,
          hsl(var(--primary) / 0.10) 40deg,
          transparent 90deg,
          transparent 360deg
        );
        mask: radial-gradient(circle, transparent 18px, #000 19px);
        -webkit-mask: radial-gradient(circle, transparent 18px, #000 19px);
        animation: kfupm-radar-beam 4s linear infinite;
      }

      .kfupm-radar-you {
        position: absolute; left: 50%; top: 50%;
        transform: translate(-50%, -50%);
        width: 28px; height: 28px;
        border-radius: 9999px;
        background: hsl(var(--background));
        border: 2px solid hsl(var(--primary));
        box-shadow: 0 0 0 6px hsl(var(--primary) / 0.18), 0 6px 20px hsl(var(--primary) / 0.35);
        display: grid; place-items: center;
      }
      .kfupm-radar-you-dot {
        width: 12px; height: 12px; border-radius: 9999px;
        background: hsl(var(--primary));
      }

      .kfupm-radar-car {
        position: absolute; left: 50%; top: 50%;
        transform: translate(calc(-50% + 70px), calc(-50% - 56px));
      }
      .kfupm-radar-car-halo {
        position: absolute; left: 50%; top: 50%;
        width: 44px; height: 44px;
        border-radius: 9999px;
        background: hsl(var(--success) / 0.25);
        transform: translate(-50%, -50%);
        animation: kfupm-radar-car-halo 1.6s ease-out infinite;
      }
      @keyframes kfupm-radar-car-halo {
        0%   { transform: translate(-50%, -50%) scale(0.7); opacity: 0.7; }
        100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0;   }
      }
      .kfupm-radar-car-dot {
        position: relative;
        display: grid; place-items: center;
        width: 30px; height: 30px;
        border-radius: 9999px;
        background: hsl(var(--success));
        border: 2px solid hsl(var(--background));
        box-shadow: 0 8px 22px hsl(var(--success) / 0.45);
      }

      @keyframes kfupm-car-bob {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-6px); }
      }
      .kfupm-car-bob { animation: kfupm-car-bob 2s ease-in-out infinite; }

      @keyframes kfupm-spin-cw  { to { transform: rotate(360deg); } }
      @keyframes kfupm-spin-ccw { to { transform: rotate(-360deg); } }
      .kfupm-rotate-slow { animation: kfupm-spin-cw  12s linear infinite; }
      .kfupm-rotate-fast { animation: kfupm-spin-ccw  8s linear infinite; }
    `}</style>
  );
}
