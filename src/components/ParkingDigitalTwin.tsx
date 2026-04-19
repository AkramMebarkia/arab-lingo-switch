import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Car, Check, Lock, Navigation, X } from "lucide-react";
import type { ParkingLot, UserType } from "@/lib/mock-data";
import { appStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";

/* ================================================================
   Modern parking-spot picker — inspired by the AirParky reference.
   ▸ Pure SVG grid of slots with car icons drawn for occupied spots.
   ▸ Empty slots are tappable; the user picks where they will park.
   ▸ "Park here" saves the slot to appStore.savedCar so FindCar can
     locate it later. No timer (per request).
   ▸ Floors supported only for `kind === "covered"` lots.
   ================================================================ */

interface SlotData {
  id: string;
  index: number;     // 1-based label
  row: number;
  col: number;
  status: "available" | "occupied" | "restricted" | "reserved";
  floor: number;
}

interface Props {
  lot: ParkingLot;
  userType: UserType;
  onClose: () => void;
  onNavigate: () => void;
}

/* ---------- geometry ---------- */
const COLS = 6;                 // 6 cars per row, like the reference
const ROWS_PER_FLOOR = 4;       // 2 lanes (top + bottom), 4 rows total
const SLOT_W = 56;
const SLOT_H = 86;
const GAP_X = 6;
const GAP_Y = 28;               // visual driving lane between row-pairs
const PAD = 18;
const SVG_W = PAD * 2 + COLS * SLOT_W + (COLS - 1) * GAP_X;

/* deterministic RNG so a lot/floor always renders the same */
function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateSlots(lot: ParkingLot, isStudent: boolean, floor: number): SlotData[] {
  const total = ROWS_PER_FLOOR * COLS; // 24 visible per floor
  const seedSum =
    lot.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + floor * 31;
  const rnd = seeded(seedSum);

  // share the lot's overall fill ratio across visible slots
  const fillRatio = (lot.total - lot.available) / Math.max(lot.total, 1);
  const occupiedTarget = Math.round(total * fillRatio);
  const occupiedSet = new Set<number>();
  while (occupiedSet.size < occupiedTarget) {
    occupiedSet.add(Math.floor(rnd() * total));
  }

  const restrictedTarget = isStudent ? 2 : 0;
  const restrictedSet = new Set<number>();
  while (restrictedSet.size < restrictedTarget) {
    const idx = Math.floor(rnd() * total);
    if (!occupiedSet.has(idx)) restrictedSet.add(idx);
  }

  const slots: SlotData[] = [];
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const status: SlotData["status"] = occupiedSet.has(i)
      ? "occupied"
      : restrictedSet.has(i)
      ? "restricted"
      : "available";
    slots.push({
      id: `${floor}-${row}-${col}`,
      index: i + 1,
      row,
      col,
      status,
      floor,
    });
  }
  return slots;
}

function isFemaleRestrictedFloor(lotId: string, floor: number): boolean {
  return (lotId === "L-23" && floor === 3) || (lotId === "L-25" && floor === 2);
}

/* ---------- component ---------- */
export const ParkingDigitalTwin = memo(function ParkingDigitalTwin({
  lot,
  userType,
  onClose,
  onNavigate,
}: Props) {
  const { t } = useTranslation();
  const isStudent = !["faculty", "staff", "handicap"].includes(userType);
  const isCovered = lot.kind === "covered";
  const floors = isCovered ? [1, 2, 3] : [1];
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [side, setSide] = useState<"left" | "right">("left");
  const [picked, setPicked] = useState<SlotData | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const slots = useMemo(
    () => generateSlots(lot, isStudent, activeFloor),
    [lot, isStudent, activeFloor],
  );

  const counts = useMemo(() => {
    const c = { available: 0, occupied: 0, restricted: 0 };
    for (const s of slots) c[s.status as "available" | "occupied" | "restricted"]++;
    return c;
  }, [slots]);

  const yForRow = (row: number) => {
    // gap between row 1 and row 2 (driving lane)
    const lane = row >= 2 ? GAP_Y : 0;
    return PAD + 18 + row * (SLOT_H + 4) + lane;
  };
  const SVG_H = yForRow(ROWS_PER_FLOOR - 1) + SLOT_H + PAD + 6;

  const sideLabel = side === "left" ? t("digitalTwin.leftSide") : t("digitalTwin.rightSide");

  const handlePickSlot = (s: SlotData) => {
    if (s.status !== "available") return;
    setPicked(s);
  };

  const handleConfirm = () => {
    if (!picked) return;
    appStore.set({
      savedCar: {
        lotId: lot.id,
        slotLabel: `${t("digitalTwin.floor", { n: picked.floor })} · ${t("digitalTwin.slot")} ${String(picked.index).padStart(2, "0")}`,
        savedAt: Date.now(),
      },
    });
    setConfirmed(true);
    // Brief success state, then close
    window.setTimeout(() => onClose(), 1100);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("digitalTwin.title")}
      className="fixed inset-0 z-[1000] overflow-y-auto bg-background/95 backdrop-blur-md animate-fade-in"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 pt-5 pb-32">
        {/* ── header bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            aria-label={t("digitalTwin.close")}
            className="glass flex h-11 w-11 items-center justify-center rounded-full transition-smooth hover:scale-105"
          >
            <X className="h-4 w-4" />
          </button>

          <button
            onClick={() => setSide((s) => (s === "left" ? "right" : "left"))}
            className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-smooth hover:scale-[1.02]"
            aria-label={t("digitalTwin.toggleSide")}
          >
            <span className="rtl:rotate-180">⇄</span>
            {sideLabel}
          </button>
        </div>

        {/* ── lot title + live chips ─────────────────────── */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
            {t("digitalTwin.title")}
          </p>
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight">{lot.name}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Chip tone="success">
            <Dot tone="success" /> {counts.available} {t("digitalTwin.available")}
          </Chip>
          <Chip tone="destructive">
            <Dot tone="destructive" /> {counts.occupied} {t("digitalTwin.occupied")}
          </Chip>
          {counts.restricted > 0 && (
            <Chip tone="muted">
              <Dot tone="muted" /> {counts.restricted} {t("digitalTwin.restricted")}
            </Chip>
          )}
        </div>

        {/* ── floor tabs (covered only) ──────────────────── */}
        {isCovered && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {floors.map((f) => {
              const femaleOnly = isFemaleRestrictedFloor(lot.id, f);
              const disabled = femaleOnly && userType !== "female-resident";
              const active = activeFloor === f;
              return (
                <button
                  key={f}
                  disabled={disabled}
                  onClick={() => !disabled && (setActiveFloor(f), setPicked(null))}
                  aria-label={t("digitalTwin.floor", { n: f })}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-smooth",
                    active
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "border border-border bg-card text-foreground hover:border-primary/40",
                    disabled && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {t("digitalTwin.floor", { n: f })}
                  {femaleOnly && (
                    <span className="rounded-full bg-pink-500/20 px-1.5 py-0.5 text-[9px] font-medium text-pink-500">
                      ♀
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── slot grid ──────────────────────────────────── */}
        <div className="glass-strong shadow-elevated relative overflow-hidden rounded-3xl p-3 animate-fade-in">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="block w-full"
              role="img"
              aria-label={t("digitalTwin.title")}
            >
              {/* asphalt panel */}
              <rect
                x={4}
                y={4}
                width={SVG_W - 8}
                height={SVG_H - 8}
                rx={20}
                fill="hsl(var(--muted) / 0.45)"
              />

              {/* dashed lane line in the middle gap */}
              <line
                x1={PAD}
                y1={yForRow(2) - GAP_Y / 2}
                x2={SVG_W - PAD}
                y2={yForRow(2) - GAP_Y / 2}
                stroke="hsl(var(--muted-foreground) / 0.45)"
                strokeWidth={1.6}
                strokeDasharray="6 7"
              />

              {/* slots */}
              {slots.map((s) => {
                const x = PAD + s.col * (SLOT_W + GAP_X);
                const y = yForRow(s.row);
                const isPicked = picked?.id === s.id;
                const isAvail = s.status === "available";
                const isOcc = s.status === "occupied";
                const isRest = s.status === "restricted";

                return (
                  <g
                    key={s.id}
                    onClick={() => handlePickSlot(s)}
                    style={{ cursor: isAvail ? "pointer" : "default" }}
                  >
                    {/* slot box */}
                    <rect
                      x={x}
                      y={y}
                      width={SLOT_W}
                      height={SLOT_H}
                      rx={10}
                      fill={
                        isPicked
                          ? "hsl(var(--primary))"
                          : isOcc
                          ? "hsl(var(--card))"
                          : isRest
                          ? "hsl(var(--muted))"
                          : "hsl(var(--background))"
                      }
                      stroke={
                        isPicked
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))"
                      }
                      strokeWidth={isPicked ? 2 : 1.2}
                    />

                    {/* slot inner number label */}
                    {!isOcc && (
                      <text
                        x={x + SLOT_W / 2}
                        y={y + 16}
                        fontSize={9}
                        fontWeight={700}
                        textAnchor="middle"
                        fill={
                          isPicked
                            ? "hsl(var(--primary-foreground))"
                            : "hsl(var(--muted-foreground))"
                        }
                        fontFamily="ui-sans-serif, system-ui"
                      >
                        {String(s.index).padStart(2, "0")}
                      </text>
                    )}

                    {/* car for occupied */}
                    {isOcc && (
                      <CarShape
                        x={x + 6}
                        y={y + 8}
                        w={SLOT_W - 12}
                        h={SLOT_H - 16}
                      />
                    )}

                    {/* lock for restricted */}
                    {isRest && (
                      <text
                        x={x + SLOT_W / 2}
                        y={y + SLOT_H / 2 + 7}
                        fontSize={20}
                        textAnchor="middle"
                      >
                        🔒
                      </text>
                    )}

                    {/* check on picked */}
                    {isPicked && (
                      <g>
                        <circle
                          cx={x + SLOT_W / 2}
                          cy={y + SLOT_H / 2 + 6}
                          r={14}
                          fill="hsl(var(--primary-foreground))"
                        />
                        <text
                          x={x + SLOT_W / 2}
                          y={y + SLOT_H / 2 + 11}
                          fontSize={16}
                          fontWeight={900}
                          textAnchor="middle"
                          fill="hsl(var(--primary))"
                        >
                          ✓
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ENTRY arrow at bottom centre */}
              <g transform={`translate(${SVG_W / 2 - 36}, ${SVG_H - 14})`}>
                <text
                  x={36}
                  y={6}
                  fontSize={9}
                  fontWeight={800}
                  textAnchor="middle"
                  fill="hsl(var(--primary))"
                  fontFamily="ui-sans-serif, system-ui"
                  letterSpacing={1}
                >
                  ▲ {t("digitalTwin.entry")}
                </text>
              </g>
            </svg>
          </div>

          {/* legend */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <Legend swatch="hsl(var(--background))" border>{t("digitalTwin.available")}</Legend>
            <Legend swatch="hsl(var(--card))" car>{t("digitalTwin.occupied")}</Legend>
            <Legend swatch="hsl(var(--primary))">{t("digitalTwin.selected")}</Legend>
            {counts.restricted > 0 && (
              <Legend swatch="hsl(var(--muted))">{t("digitalTwin.restricted")}</Legend>
            )}
          </div>
        </div>

        {/* ── female-only floor warning ──────────────────── */}
        {isFemaleRestrictedFloor(lot.id, activeFloor) && userType !== "female-resident" && (
          <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <Lock className="h-4 w-4" />
            <span>{t("digitalTwin.femaleOnly")}</span>
          </div>
        )}
      </div>

      {/* ── sticky footer action bar ─────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-md p-4">
          <div className="glass-strong shadow-elevated rounded-2xl p-3">
            {confirmed ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-success/15 px-4 py-3 text-sm font-semibold text-success animate-scale-in">
                <Check className="h-4 w-4" /> {t("digitalTwin.slotSaved")}
              </div>
            ) : picked ? (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("digitalTwin.youPicked")}
                  </p>
                  <p className="truncate text-sm font-bold">
                    {t("digitalTwin.floor", { n: picked.floor })} · {t("digitalTwin.slot")} {String(picked.index).padStart(2, "0")}
                  </p>
                </div>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
                >
                  <Check className="h-4 w-4" /> {t("digitalTwin.parkHere")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="flex-1 text-xs text-muted-foreground">
                  {t("digitalTwin.tapToPick")}
                </p>
                <button
                  onClick={() => { onNavigate(); onClose(); }}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold transition-smooth hover:bg-muted"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  {t("digitalTwin.navigate")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ---------- bits ---------- */

function CarShape({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  // Top-down car shape that fits inside a slot rect.
  const cx = x + w / 2;
  const bodyW = w * 0.78;
  const bodyH = h * 0.84;
  const bodyX = cx - bodyW / 2;
  const bodyY = y + (h - bodyH) / 2;
  const winW = bodyW * 0.66;
  const winX = cx - winW / 2;
  return (
    <g>
      {/* shadow */}
      <rect
        x={bodyX + 2}
        y={bodyY + 4}
        width={bodyW}
        height={bodyH}
        rx={8}
        fill="hsl(var(--foreground) / 0.18)"
      />
      {/* body */}
      <rect
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        rx={9}
        fill="hsl(var(--foreground))"
      />
      {/* windshield (top) */}
      <rect
        x={winX}
        y={bodyY + bodyH * 0.12}
        width={winW}
        height={bodyH * 0.22}
        rx={3}
        fill="hsl(var(--background) / 0.85)"
      />
      {/* rear window */}
      <rect
        x={winX}
        y={bodyY + bodyH * 0.66}
        width={winW}
        height={bodyH * 0.18}
        rx={3}
        fill="hsl(var(--background) / 0.55)"
      />
      {/* headlights */}
      <rect x={bodyX + 3} y={bodyY + 3} width={6} height={3} rx={1} fill="hsl(var(--background))" />
      <rect x={bodyX + bodyW - 9} y={bodyY + 3} width={6} height={3} rx={1} fill="hsl(var(--background))" />
    </g>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "destructive" | "muted";
}) {
  const cls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold", cls)}>
      {children}
    </span>
  );
}

function Dot({ tone }: { tone: "success" | "destructive" | "muted" }) {
  const cls =
    tone === "success"
      ? "bg-success"
      : tone === "destructive"
      ? "bg-destructive"
      : "bg-muted-foreground";
  return <span className={cn("h-1.5 w-1.5 rounded-full", cls)} />;
}

function Legend({
  swatch,
  border,
  car,
  children,
}: {
  swatch: string;
  border?: boolean;
  car?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-flex h-4 w-5 items-center justify-center rounded-[3px]"
        style={{
          background: swatch,
          border: border ? "1px solid hsl(var(--border))" : "none",
        }}
      >
        {car && <Car className="h-2.5 w-2.5 text-foreground" />}
      </span>
      {children}
    </span>
  );
}
