import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Bell, Coins, Filter, Lock, Navigation, Sparkles, TrendingUp,
  Wand2, X, Repeat, ShoppingBag, Clock, AlertTriangle, ShieldAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/app-store";
import { PARKING_LOTS, USER_TYPE_META, type ParkingLot, type UserType } from "@/lib/mock-data";
import { PhoneShell } from "@/components/PhoneShell";
import { ParkingMap, type LotMarkerState } from "@/components/ParkingMap";
import { StatusBadge } from "@/components/StatusBadge";
import { RerouteSheet } from "@/components/RerouteSheet";
import { ParkingDigitalTwin } from "@/components/ParkingDigitalTwin";
import { notificationsStore, useNotifications, relativeTime, type Notification } from "@/lib/notifications-store";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const user = useAppState((s) => s.user);
  const credits = useAppState((s) => s.credits);
  const theme = useAppState((s) => s.theme);
  const { t, i18n } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navTo, setNavTo] = useState<ParkingLot | null>(null);
  const [reroute, setReroute] = useState<{ from: ParkingLot; to: ParkingLot } | null>(null);
  const [accessBanner, setAccessBanner] = useState<{ kind: "ineligible" | "prohibited"; lot: ParkingLot } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDigitalTwin, setShowDigitalTwin] = useState<ParkingLot | null>(null);

  const notifications = useNotifications((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const userType = user?.type;
  const eligible = useMemo(
    () => userType ? PARKING_LOTS.filter((l) => !l.prohibited && l.eligibleFor.includes(userType)) : [],
    [userType],
  );
  const ineligible = useMemo(
    () => userType ? PARKING_LOTS.filter((l) => !l.prohibited && !l.eligibleFor.includes(userType)) : [],
    [userType],
  );
  const prohibited = useMemo(() => PARKING_LOTS.filter((l) => l.prohibited), []);
  const totalNonProhibited = PARKING_LOTS.filter((l) => !l.prohibited).length;

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

  // Simulate curfew warning notification on mount (once per session)
  const curfewFired = useRef(false);
  useEffect(() => {
    if (!user || curfewFired.current) return;
    if (USER_TYPE_META[user.type].curfew) {
      curfewFired.current = true;
      notificationsStore.add({
        type: "curfew",
        title: t("notifications.commuterCurfew"),
        body: t("notifications.commuterCurfewBody"),
      });
    }
  }, [user, t]);

  // Auto-dismiss permit banner after 3s
  useEffect(() => {
    if (!accessBanner) return;
    const id = setTimeout(() => setAccessBanner(null), 3000);
    return () => clearTimeout(id);
  }, [accessBanner]);

  if (!user) return <Navigate to="/" replace />;

  const selected = eligible.find((l) => l.id === selectedId) ?? null;
  const tName = (l: ParkingLot) => t(`lots.${l.id}`, { defaultValue: l.name });
  const tZone = (l: ParkingLot) => t(`zones.${l.zone}`, { defaultValue: l.zone });
  const permitTag = t(`userTypes.${user.type}.tag`);

  const openWalkingDirections = (lot: ParkingLot) => {
    const [lng, lat] = lot.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSelect = (id: string, state: LotMarkerState) => {
    if (state === "eligible") {
      setSelectedId(id);
      setAccessBanner(null);
      return;
    }
    const lot =
      state === "ineligible"
        ? ineligible.find((l) => l.id === id)
        : prohibited.find((l) => l.id === id);
    if (!lot) return;
    setAccessBanner({ kind: state, lot });
    setSelectedId(null);
  };

  const handleNavigate = (lot: ParkingLot) => {
    setSelectedId(lot.id);
    setNavTo(lot);
    openWalkingDirections(lot);
    if (lot.status === "limited") {
      setTimeout(() => {
        const next = recommended.find((l) => l.id !== lot.id && l.status === "available");
        if (next) {
          setReroute({ from: lot, to: next });
          notificationsStore.add({
            type: "reroute",
            title: t("notifications.smartReroute"),
            body: t("notifications.smartRerouteBody", { from: tName(lot), to: tName(next) }),
            lotId: next.id,
          });
        }
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

  const eligibleCount = eligible.length;

  // For ineligible banner, find a representative permit name allowed on this lot
  const requiredPermitName = (lot: ParkingLot) => {
    const first = lot.eligibleFor[0];
    return first ? t(`userTypes.${first}.tag`) : t("permit.locked");
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
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{permitTag}</p>
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
          <button
            onClick={() => setShowNotifications(true)}
            aria-label={t("notifications.title")}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-smooth hover:bg-secondary"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Permit access summary */}
        <div className="glass shadow-soft flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] animate-fade-in">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: USER_TYPE_META[user.type].permitColor }}
          />
          <span className="font-medium">
            {t("home.permitAccess", { permit: permitTag, n: eligibleCount, total: totalNonProhibited })}
          </span>
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
          <ParkingMap
            lots={eligible}
            ineligible={ineligible}
            prohibited={prohibited}
            selectedId={selectedId}
            onSelect={handleSelect}
            routeTo={navTo}
            theme={theme}
          />
        </div>

        {/* Permit access banner */}
        {accessBanner && (
          <div
            role="status"
            className={cn(
              "glass-strong flex items-start gap-3 rounded-2xl border p-3 text-xs animate-slide-up",
              accessBanner.kind === "prohibited"
                ? "border-destructive/30 bg-destructive/5"
                : "border-warning/30 bg-warning/5",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                accessBanner.kind === "prohibited"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-warning/15 text-warning",
              )}
            >
              {accessBanner.kind === "prohibited"
                ? <ShieldAlert className="h-4 w-4" />
                : <Lock className="h-4 w-4" />}
            </div>
            <div className="flex-1 leading-snug">
              <p className="font-medium">
                {accessBanner.kind === "prohibited"
                  ? t("permit.prohibitedBanner")
                  : t("permit.ineligibleBanner", {
                      required: requiredPermitName(accessBanner.lot),
                      current: permitTag,
                    })}
              </p>
            </div>
          </div>
        )}

        <div>
          {selected ? (
            <SelectedCard
              lot={selected}
              name={tName(selected)}
              zone={tZone(selected)}
              onNavigate={() => handleNavigate(selected)}
              onViewInside={() => setShowDigitalTwin(selected)}
            />
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

      {/* Notification panel */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          lang={(i18n.language === "ar" ? "ar" : "en") as "en" | "ar"}
          onClose={() => { notificationsStore.markAllRead(); setShowNotifications(false); }}
        />
      )}

      {/* Digital twin modal */}
      {showDigitalTwin && (
        <ParkingDigitalTwin
          lot={showDigitalTwin}
          userType={user.type as UserType}
          onClose={() => setShowDigitalTwin(null)}
          onNavigate={() => handleNavigate(showDigitalTwin)}
        />
      )}
    </PhoneShell>
  );
}

/* ---------- Notification panel ---------- */

const NOTIF_ICON: Record<Notification["type"], { bg: string; text: string; Icon: typeof Bell }> = {
  trade:    { bg: "bg-primary/15",     text: "text-primary",     Icon: ShoppingBag },
  reroute:  { bg: "bg-warning/15",     text: "text-warning",     Icon: Repeat },
  curfew:   { bg: "bg-warning/20",     text: "text-warning",     Icon: Clock },
  "lot-full": { bg: "bg-destructive/15", text: "text-destructive", Icon: AlertTriangle },
};

function NotificationPanel({
  notifications, unreadCount, lang, onClose,
}: {
  notifications: Notification[];
  unreadCount: number;
  lang: "en" | "ar";
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("notifications.title")}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <button
        aria-label={t("common.cancel")}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative z-10 mx-auto w-full max-w-md animate-slide-up">
        <div className="glass-strong shadow-elevated max-h-[70vh] overflow-y-auto rounded-t-3xl">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card/80 px-5 py-4 backdrop-blur">
            <h2 className="text-base font-semibold">{t("notifications.title")}</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                {t("notifications.unread", { n: unreadCount })}
              </span>
            )}
            <button
              onClick={() => notificationsStore.markAllRead()}
              className="ms-auto text-xs font-semibold text-primary transition-smooth hover:underline"
            >
              {t("notifications.markAllRead")}
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Bell className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-semibold">{t("notifications.empty")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("notifications.emptySub")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const meta = NOTIF_ICON[n.type];
                const Icon = meta.Icon;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "relative flex items-start gap-3 px-5 py-3.5 transition-smooth hover:bg-muted/50",
                      !n.read && "bg-primary/5",
                    )}
                    onClick={() => notificationsStore.markRead(n.id)}
                  >
                    {!n.read && (
                      <span className="absolute start-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.bg, meta.text)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{relativeTime(n.timestamp, lang)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); notificationsStore.remove(n.id); }}
                      aria-label={t("notifications.dismiss")}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Recommendations + Selected ---------- */

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
  lot, name, zone, onNavigate, onViewInside,
}: { lot: ParkingLot; name: string; zone: string; onNavigate: () => void; onViewInside: () => void }) {
  const { t } = useTranslation();
  const fillPct = Math.round(((lot.total - lot.available) / lot.total) * 100);
  const showViewInside = lot.kind === "covered" || lot.total >= 50;
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

      {showViewInside && (
        <button
          onClick={onViewInside}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-smooth hover:bg-muted"
        >
          {t("home.viewInside")} <span className="rtl:rotate-180">→</span>
        </button>
      )}
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
