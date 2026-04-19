import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Bell, Coins, Filter, Navigation, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/app-store";
import { PARKING_LOTS, USER_TYPE_META, type ParkingLot } from "@/lib/mock-data";
import { PhoneShell } from "@/components/PhoneShell";
import { ParkingMap } from "@/components/ParkingMap";
import { StatusBadge } from "@/components/StatusBadge";
import { RerouteSheet } from "@/components/RerouteSheet";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const user = useAppState((s) => s.user);
  const credits = useAppState((s) => s.credits);
  const theme = useAppState((s) => s.theme);
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navTo, setNavTo] = useState<ParkingLot | null>(null);
  const [reroute, setReroute] = useState<{ from: ParkingLot; to: ParkingLot } | null>(null);

  const userType = user?.type;
  const eligible = useMemo(
    () => userType ? PARKING_LOTS.filter((l) => !l.prohibited && l.eligibleFor.includes(userType)) : [],
    [userType],
  );
  const prohibited = useMemo(() => PARKING_LOTS.filter((l) => l.prohibited), []);
  const recommended = useMemo(
    () => [...eligible].sort((a, b) => {
      const score = (l: ParkingLot) =>
        (l.status === "available" ? 0 : l.status === "limited" ? 1 : 3) +
        l.walkingMin * 0.3 - (l.available / l.total) * 1.5;
      return score(a) - score(b);
    }),
    [eligible],
  );
  const stats = useMemo(() => {
    const open = eligible.filter((l) => l.status === "available").length;
    const busy = eligible.filter((l) => l.status === "limited").length;
    const full = eligible.filter((l) => l.status === "occupied").length;
    const spaces = eligible.reduce((sum, l) => sum + l.available, 0);
    return { lots: eligible.length, open, busy, full, spaces };
  }, [eligible]);

  if (!user) return <Navigate to="/" replace />;

  const selected = eligible.find((l) => l.id === selectedId) ?? null;
  const tName = (l: ParkingLot) => t(`lots.${l.id}`, { defaultValue: l.name });
  const tZone = (l: ParkingLot) => t(`zones.${l.zone}`, { defaultValue: l.zone });

  const openWalkingDirections = (lot: ParkingLot) => {
    const [lng, lat] = lot.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNavigate = (lot: ParkingLot) => {
    setSelectedId(lot.id);
    setNavTo(lot);
    openWalkingDirections(lot);
    if (lot.status === "limited") {
      setTimeout(() => {
        const next = recommended.find((l) => l.id !== lot.id && l.status === "available");
        if (next) setReroute({ from: lot, to: next });
      }, 1800);
    }
  };

  const acceptReroute = () => {
    if (!reroute) return;
    setSelectedId(reroute.to.id);
    setNavTo(reroute.to);
    openWalkingDirections(reroute.to);
    setReroute(null);
  };

  return (
    <PhoneShell>
      <div className="flex flex-col gap-3 p-4">
        {/* Header */}
        <div className="glass-strong shadow-soft flex items-center gap-3 rounded-2xl p-3 animate-fade-in">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-primary-foreground shadow-glow"
            style={{ background: USER_TYPE_META[user.type].permitColor }}
          >
            {USER_TYPE_META[user.type].emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t(`userTypes.${user.type}.tag`)}
            </p>
            <p className="truncate text-sm font-semibold">{user.name}</p>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-1.5 text-primary"
            aria-label={`${credits} ${t("common.credits")}`}
          >
            <Coins className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{credits}</span>
          </div>
          <button aria-label="Filter" className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-smooth hover:bg-secondary">
            <Filter className="h-4 w-4" />
          </button>
          <button aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-smooth hover:bg-secondary">
            <Bell className="h-4 w-4" />
            <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 animate-fade-in">
          <StatTile value={stats.lots} label={t("home.stats.lots")} tone="primary" />
          <StatTile value={stats.open} label={t("home.stats.open")} tone="success" />
          <StatTile value={stats.busy} label={t("home.stats.busy")} tone="warning" />
          <StatTile value={stats.full} label={t("home.stats.full")} tone="destructive" />
          <StatTile value={stats.spaces} label={t("home.stats.spaces")} tone="success" />
        </div>

        {USER_TYPE_META[user.type].curfew && (
          <div className="glass-strong shadow-soft flex items-center gap-2 rounded-xl px-3 py-2 text-xs animate-fade-in">
            <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-warning" />
            <span className="font-medium">{t("home.commuterCurfew")}</span>
            <span className="text-muted-foreground">{t("home.curfewDetail")}</span>
          </div>
        )}
        {prohibited.length > 0 && (
          <div className="glass-strong flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] text-muted-foreground animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            <span>{t("home.restrictedHidden", { n: prohibited.length })}</span>
          </div>
        )}

        {/* Map */}
        <div className="shadow-elevated relative h-[44svh] min-h-[280px] w-full overflow-hidden rounded-3xl border border-border">
          <ParkingMap lots={eligible} selectedId={selectedId} onSelect={setSelectedId} routeTo={navTo} theme={theme} />
        </div>

        <div>
          {selected ? (
            <SelectedCard lot={selected} name={tName(selected)} zone={tZone(selected)} onNavigate={() => handleNavigate(selected)} />
          ) : (
            <RecommendationsCard lots={recommended} tName={tName} onSelect={(l) => setSelectedId(l.id)} onNavigate={handleNavigate} />
          )}
        </div>

        <RerouteSheet
          open={!!reroute}
          fromLot={reroute?.from ?? null}
          toLot={reroute?.to ?? null}
          onAccept={acceptReroute}
          onDismiss={() => setReroute(null)}
        />
      </div>
    </PhoneShell>
  );
}

function RecommendationsCard({
  lots, tName, onSelect, onNavigate,
}: {
  lots: ParkingLot[];
  tName: (l: ParkingLot) => string;
  onSelect: (l: ParkingLot) => void;
  onNavigate: (l: ParkingLot) => void;
}) {
  const { t } = useTranslation();
  const top = lots.slice(0, 3);
  return (
    <div className="glass-strong shadow-elevated overflow-hidden rounded-3xl animate-slide-up">
      <div className="flex items-center gap-2 px-4 pt-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold">{t("home.bestForYou")}</h3>
        <span className="ms-auto text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("home.aiRanked")}
        </span>
      </div>
      <div className="scrollbar-hide mt-2 flex gap-3 overflow-x-auto px-4 pb-4 pt-1">
        {top.map((lot) => (
          <button
            key={lot.id}
            onClick={() => onSelect(lot)}
            className={cn(
              "group min-w-[220px] shrink-0 rounded-2xl border border-border bg-card/80 p-3 text-start transition-smooth hover:border-primary/40 hover:shadow-glow",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{lot.id}</span>
              <StatusBadge status={lot.status} />
            </div>
            <p className="mt-1 text-sm font-semibold leading-tight">{tName(lot)}</p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>🚶 {lot.walkingMin} {t("common.min")}</span>
              <span>📍 {lot.distanceM} {t("common.m")}</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-success/10 px-2 py-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-success/80">
                {t("home.empty")}
              </span>
              <span className="text-sm font-bold text-success">
                {lot.available}
                <span className="text-[10px] font-medium text-muted-foreground"> / {lot.total}</span>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-[10px] text-primary">
              <TrendingUp className="h-3 w-3" />
              {lot.prediction}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(lot); }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-smooth hover:brightness-110"
            >
              <Navigation className="h-3.5 w-3.5" /> {t("home.navigate")}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectedCard({
  lot, name, zone, onNavigate,
}: { lot: ParkingLot; name: string; zone: string; onNavigate: () => void }) {
  const { t } = useTranslation();
  const fillPct = Math.round(((lot.total - lot.available) / lot.total) * 100);
  return (
    <div className="glass-strong shadow-elevated rounded-3xl p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
          <Wand2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{name}</p>
            <StatusBadge status={lot.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {zone} · {lot.distanceM} {t("common.m")} · {t("common.minWalk", { n: lot.walkingMin })}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric label={t("home.metrics.available")} value={`${lot.available}`} />
        <Metric label={t("home.metrics.total")} value={`${lot.total}`} />
        <Metric label={t("home.metrics.filled")} value={`${fillPct}%`} />
      </div>

      <div className="mt-3 rounded-2xl bg-primary/10 px-3 py-2 text-xs text-primary">
        <span className="font-semibold">{t("home.prediction")}</span>
        {lot.prediction}
      </div>

      <button
        onClick={onNavigate}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
      >
        <Navigation className="h-4 w-4" />
        {t("home.startNav")}
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-2">
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function StatTile({
  value, label, tone,
}: { value: number; label: string; tone: "primary" | "success" | "warning" | "destructive" }) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];
  return (
    <div className="glass-strong shadow-soft flex flex-col items-center justify-center rounded-2xl px-1 py-2.5">
      <p className={cn("text-base font-extrabold leading-none", toneClass)}>{value}</p>
      <p className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
