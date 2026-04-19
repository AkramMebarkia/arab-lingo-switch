import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Navigation, X } from "lucide-react";
import type { ParkingLot, UserType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SlotData {
  id: string;
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

const COLS = 8;
const SLOT_W = 28;
const SLOT_H = 16;
const GAP = 3;
const LANE_GAP = 24;
const ROW_LABEL_WIDTH = 18;
const SVG_W = 520;
const SVG_PAD = 14;

// Seeded RNG for deterministic occupied placement
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function generateSlots(lot: ParkingLot, isStudent: boolean, floor: number): SlotData[] {
  const cap = Math.min(lot.total, 180);
  const seedSum = lot.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + floor * 17;
  const rnd = seededRandom(seedSum);

  const occupiedTarget = Math.min(cap, Math.round(((lot.total - lot.available) / Math.max(lot.total, 1)) * cap));
  const occupiedSet = new Set<number>();
  while (occupiedSet.size < occupiedTarget) {
    occupiedSet.add(Math.floor(rnd() * cap));
  }

  const restrictedTarget = isStudent ? Math.round(cap * 0.08) : 0;
  const restrictedSet = new Set<number>();
  while (restrictedSet.size < restrictedTarget) {
    const idx = Math.floor(rnd() * cap);
    if (!occupiedSet.has(idx)) restrictedSet.add(idx);
  }

  const slots: SlotData[] = [];
  for (let i = 0; i < cap; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const status: SlotData["status"] = occupiedSet.has(i)
      ? "occupied"
      : restrictedSet.has(i)
      ? "restricted"
      : "available";
    slots.push({ id: `${floor}-${row}-${col}`, row, col, status, floor });
  }
  return slots;
}

function isFemaleRestrictedFloor(lotId: string, floor: number): boolean {
  // Lot 23 floor 3, Lot 25 floor 2 — strictly female residents
  return (lotId === "L-23" && floor === 3) || (lotId === "L-25" && floor === 2);
}

export const ParkingDigitalTwin = memo(function ParkingDigitalTwin({
  lot, userType, onClose, onNavigate,
}: Props) {
  const { t } = useTranslation();
  const isStudent = !["faculty", "staff", "handicap"].includes(userType);
  const isCovered = lot.kind === "covered";
  const floors = isCovered ? [1, 2, 3] : [1];
  const [activeFloor, setActiveFloor] = useState<number>(1);

  const slots = useMemo(
    () => generateSlots(lot, isStudent, activeFloor),
    [lot, isStudent, activeFloor],
  );

  const counts = useMemo(() => {
    const c = { available: 0, occupied: 0, restricted: 0, reserved: 0 };
    for (const s of slots) c[s.status]++;
    return c;
  }, [slots]);

  // SVG geometry: 6 rows × COLS slots, lane after every 2 rows.
  const totalRows = Math.ceil(slots.length / COLS);
  const slotAreaW = COLS * SLOT_W + (COLS - 1) * GAP;
  const startX = SVG_PAD + ROW_LABEL_WIDTH;
  const yForRow = (row: number) => {
    const lanesBefore = Math.floor(row / 2);
    return SVG_PAD + 32 + row * (SLOT_H + GAP) + lanesBefore * LANE_GAP;
  };
  const lastY = yForRow(totalRows - 1) + SLOT_H + GAP;
  const SVG_H = lastY + 60;

  const fillFor = (s: SlotData["status"]) => {
    switch (s) {
      case "available": return "hsl(var(--success) / 0.85)";
      case "occupied": return "hsl(var(--destructive) / 0.85)";
      case "restricted": return "hsl(var(--muted))";
      case "reserved": return "hsl(var(--warning) / 0.9)";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Parking lot floor plan"
      className="fixed inset-0 z-[1000] overflow-y-auto bg-background/98 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-3 px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-primary">{t("digitalTwin.title")}</p>
            <h2 className="truncate text-lg font-bold">{lot.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t("digitalTwin.close")}
            className="glass flex h-10 w-10 items-center justify-center rounded-full transition-smooth hover:scale-105"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Floor tabs */}
        {isCovered && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {floors.map((f) => {
              const femaleOnly = isFemaleRestrictedFloor(lot.id, f);
              const disabled = femaleOnly && userType !== "female-resident";
              const active = activeFloor === f;
              return (
                <button
                  key={f}
                  disabled={disabled}
                  onClick={() => !disabled && setActiveFloor(f)}
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
                      {t("digitalTwin.femaleOnly")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Live stats chips */}
        <div className="grid grid-cols-3 gap-2">
          <Stat value={counts.available} label={t("digitalTwin.available")} tone="success" />
          <Stat value={counts.occupied} label={t("digitalTwin.occupied")} tone="destructive" />
          <Stat value={counts.restricted} label={t("digitalTwin.restricted")} tone="muted" />
        </div>

        {/* Floor plan SVG */}
        <div className="glass-strong shadow-elevated overflow-hidden rounded-3xl p-3 animate-fade-in">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              style={{ overflow: "visible" }}
              className="w-full"
              role="img"
              aria-label={t("digitalTwin.title")}
            >
              {/* Outer boundary */}
              <rect
                x={SVG_PAD - 4}
                y={SVG_PAD - 4}
                width={SVG_W - (SVG_PAD - 4) * 2}
                height={SVG_H - (SVG_PAD - 4) * 2}
                rx={12}
                fill="hsl(var(--muted) / 0.4)"
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
              />

              {/* Lanes (between every pair of rows) */}
              {Array.from({ length: Math.floor(totalRows / 2) }).map((_, i) => {
                const row = (i + 1) * 2 - 1;
                const y = yForRow(row) + SLOT_H + 4;
                return (
                  <rect
                    key={`lane-${i}`}
                    x={startX - 4}
                    y={y}
                    width={slotAreaW + 8}
                    height={LANE_GAP - 8}
                    rx={4}
                    fill="hsl(var(--muted) / 0.6)"
                  />
                );
              })}

              {/* Row labels */}
              {Array.from({ length: totalRows }).map((_, r) => (
                <text
                  key={`rl-${r}`}
                  x={SVG_PAD + 2}
                  y={yForRow(r) + SLOT_H / 2 + 4}
                  fontSize={10}
                  fontWeight={700}
                  fill="hsl(var(--muted-foreground))"
                  fontFamily="ui-sans-serif, system-ui"
                >
                  {String.fromCharCode(65 + r)}
                </text>
              ))}

              {/* Slots */}
              {slots.map((s) => {
                const x = startX + s.col * (SLOT_W + GAP);
                const y = yForRow(s.row);
                return (
                  <g key={s.id}>
                    <rect
                      x={x}
                      y={y}
                      width={SLOT_W}
                      height={SLOT_H}
                      rx={2}
                      fill={fillFor(s.status)}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                    >
                      {s.status === "available" && (
                        <animate
                          attributeName="opacity"
                          values="0.7;1;0.7"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      )}
                    </rect>
                    {s.status === "restricted" && (
                      <text
                        x={x + SLOT_W / 2}
                        y={y + SLOT_H / 2 + 3}
                        fontSize={9}
                        textAnchor="middle"
                        fill="hsl(var(--muted-foreground))"
                      >
                        🔒
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Entry arrow */}
              <g transform={`translate(${SVG_W / 2 - 30}, ${SVG_H - 28})`}>
                <polygon
                  points="0,12 18,0 18,8 42,8 42,16 18,16 18,24"
                  fill="hsl(var(--primary))"
                />
                <text
                  x={50}
                  y={18}
                  fontSize={10}
                  fontWeight={800}
                  fill="hsl(var(--primary))"
                  fontFamily="ui-sans-serif, system-ui"
                >
                  {t("digitalTwin.entry")}
                </text>
              </g>
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 px-2 text-[10px]">
            <Legend color="hsl(var(--success) / 0.85)" label={t("digitalTwin.available")} />
            <Legend color="hsl(var(--destructive) / 0.85)" label={t("digitalTwin.occupied")} />
            <Legend color="hsl(var(--muted))" label={t("digitalTwin.restricted")} />
            <Legend color="hsl(var(--warning) / 0.9)" label={t("digitalTwin.reserved")} />
          </div>
        </div>

        {/* Restricted floor banner */}
        {isFemaleRestrictedFloor(lot.id, activeFloor) && userType !== "female-resident" && (
          <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground dark:text-warning">
            <Lock className="h-4 w-4" />
            <span>{t("digitalTwin.femaleOnly")}</span>
          </div>
        )}

        {/* Footer CTA */}
        <button
          onClick={() => { onNavigate(); onClose(); }}
          className="mt-auto flex items-center justify-center gap-2 rounded-2xl gradient-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
        >
          <Navigation className="h-4 w-4" />
          {t("digitalTwin.navigate")}
        </button>
      </div>
    </div>
  );
});

function Stat({ value, label, tone }: { value: number; label: string; tone: "success" | "destructive" | "muted" }) {
  const cls =
    tone === "success" ? "text-success bg-success/10"
      : tone === "destructive" ? "text-destructive bg-destructive/10"
      : "text-muted-foreground bg-muted";
  return (
    <div className={cn("rounded-2xl px-3 py-2 text-center", cls)}>
      <p className="text-base font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[9px] font-medium uppercase tracking-wider opacity-80">{label}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{ background: color, border: "1px solid hsl(var(--border))" }}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
