import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Bell, ChevronRight, CreditCard, HelpCircle, Languages, LogOut, Plus, Receipt, ShieldCheck,
  MoreHorizontal, Check, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PhoneShell } from "@/components/PhoneShell";
import { appStore, useAppState, type Vehicle } from "@/lib/app-store";
import { TRANSACTIONS } from "@/lib/mock-data";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const VEHICLE_COLORS = ["white", "black", "silver", "red", "blue", "green", "orange", "other"] as const;
type VColor = (typeof VEHICLE_COLORS)[number];

const COLOR_HEX: Record<VColor, string> = {
  white: "#F8F9FA",
  black: "#1F2937",
  silver: "#9CA3AF",
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#22C55E",
  orange: "#F97316",
  other: "#8B5CF6",
};

const YEARS = Array.from({ length: 26 }, (_, i) => String(2025 - i));
const MAX_VEHICLES = 3;

type SheetMode = { mode: "add" } | { mode: "edit"; id: string } | null;

export default function ProfilePage() {
  const user = useAppState((s) => s.user);
  const credits = useAppState((s) => s.credits);
  const vehicles = useAppState((s) => s.vehicles);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  if (!user) return <Navigate to="/" replace />;

  const handleTopUp = () => {
    const next = (appStore.get().credits ?? 0) + 50;
    appStore.set({ credits: next });
    toast.success(t("profile.topUpToast"), { description: t("profile.topUpDesc", { n: next }) });
  };

  const toggleLang = () => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");

  const setPrimary = (id: string) => {
    appStore.set({
      vehicles: vehicles.map((v) => ({ ...v, isPrimary: v.id === id })),
    });
    setOpenMenuId(null);
  };

  const removeVehicle = (id: string) => {
    const remaining = vehicles.filter((v) => v.id !== id);
    // Ensure one primary remains
    if (remaining.length > 0 && !remaining.some((v) => v.isPrimary)) {
      remaining[0].isPrimary = true;
    }
    appStore.set({ vehicles: remaining });
    setConfirmRemoveId(null);
    setOpenMenuId(null);
  };

  const saveVehicle = (data: Omit<Vehicle, "id">, editingId?: string) => {
    let next: Vehicle[];
    if (editingId) {
      next = vehicles.map((v) => (v.id === editingId ? { ...v, ...data } : v));
    } else {
      const newV: Vehicle = { ...data, id: `v-${Date.now()}` };
      next = [...vehicles, newV];
    }
    if (data.isPrimary) {
      next = next.map((v) => ({ ...v, isPrimary: v.id === (editingId ?? next[next.length - 1].id) }));
    } else if (!next.some((v) => v.isPrimary) && next.length > 0) {
      next[0].isPrimary = true;
    }
    appStore.set({ vehicles: next });
    setSheet(null);
  };

  const editingVehicle =
    sheet?.mode === "edit" ? vehicles.find((v) => v.id === sheet.id) ?? null : null;

  return (
    <PhoneShell>
      <div className="px-5 pt-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">{t("profile.kicker")}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("profile.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-5 overflow-hidden rounded-3xl gradient-hero p-5 text-primary-foreground shadow-elevated animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
              {user.type === "male-resident" ? "🟢" :
               user.type === "female-resident" ? "🩷" :
               user.type === "male-non-resident" ? "🟣" :
               user.type === "female-non-resident" ? "🩷" :
               user.type === "faculty" ? "🎓" :
               user.type === "staff" ? "💼" : "♿"}
            </div>
            <div>
              <p className="text-lg font-bold">{user.name}</p>
              <p className="text-xs opacity-80">
                {t(`userTypes.${user.type}.label`)} · {t("profile.idLabel")} {user.universityId}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wider opacity-80">{t("profile.plate")}</p>
              <p className="text-sm font-semibold">{user.plate}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wider opacity-80">{t("profile.credits")}</p>
              <p className="text-sm font-semibold">{credits}</p>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="glass-strong shadow-soft mt-5 flex items-center gap-3 rounded-2xl p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t("profile.wallet")}</p>
            <p className="text-[11px] text-muted-foreground">
              {t("profile.balance")} <span className="font-semibold text-foreground">{credits} {t("common.credits")}</span>
            </p>
          </div>
          <button
            onClick={handleTopUp}
            className="flex items-center gap-1 rounded-xl gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 active:scale-95"
            aria-label={t("profile.topUp50")}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("profile.topUp50")}
          </button>
        </div>

        {/* My Vehicles */}
        <section className="mt-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{t("vehicles.title")}</h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {vehicles.length}/{MAX_VEHICLES}
            </span>
            <button
              onClick={() => vehicles.length < MAX_VEHICLES && setSheet({ mode: "add" })}
              disabled={vehicles.length >= MAX_VEHICLES}
              aria-label={t("vehicles.addAria")}
              title={vehicles.length >= MAX_VEHICLES ? t("vehicles.max") : t("vehicles.add")}
              className={cn(
                "ms-auto flex h-9 w-9 items-center justify-center rounded-xl transition-smooth",
                vehicles.length >= MAX_VEHICLES
                  ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  : "bg-primary/15 text-primary hover:bg-primary/25",
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 space-y-2">
            {vehicles.length === 0 && (
              <div className="glass shadow-soft rounded-2xl p-4 text-center text-xs text-muted-foreground">
                {t("vehicles.add")}
              </div>
            )}
            {vehicles.map((v) => {
              const color = (VEHICLE_COLORS as readonly string[]).includes(v.color) ? (v.color as VColor) : "other";
              const fill = COLOR_HEX[color];
              return (
                <div key={v.id} className="glass shadow-soft rounded-2xl p-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <CarSilhouette fill={fill} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight">{v.plate}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {[v.make, v.model, v.year].filter(Boolean).join(" ") || t("vehicles.editTitle")}
                      </p>
                    </div>
                    {v.isPrimary && (
                      <span className="rounded-full gradient-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                        {t("vehicles.primary")}
                      </span>
                    )}
                    <button
                      aria-label={t("vehicles.moreActions")}
                      onClick={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {openMenuId === v.id && confirmRemoveId !== v.id && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 animate-fade-in">
                      {!v.isPrimary && (
                        <button
                          onClick={() => setPrimary(v.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-smooth hover:bg-primary/20"
                        >
                          <Check className="h-3.5 w-3.5" /> {t("vehicles.setPrimary")}
                        </button>
                      )}
                      <button
                        onClick={() => { setSheet({ mode: "edit", id: v.id }); setOpenMenuId(null); }}
                        className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-smooth hover:bg-secondary"
                      >
                        <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(v.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-smooth hover:bg-destructive/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> {t("common.remove")}
                      </button>
                    </div>
                  )}

                  {confirmRemoveId === v.id && (
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 animate-fade-in">
                      <p className="text-xs font-medium">{t("vehicles.removeConfirm")}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
                        >
                          {t("common.cancel")}
                        </button>
                        <button
                          onClick={() => removeVehicle(v.id)}
                          className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition-smooth hover:brightness-110"
                        >
                          {t("vehicles.confirmRemove")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-5 space-y-2">
          <Row icon={Bell} label={t("profile.rows.notifications")} sub={t("profile.rows.notificationsSub")} />
          <Row icon={ShieldCheck} label={t("profile.rows.privacy")} sub={t("profile.rows.privacySub")} />
          <Row icon={HelpCircle} label={t("profile.rows.help")} sub={t("profile.rows.helpSub")} />
          <Row icon={Languages} label={t("profile.rows.language")} sub={t("profile.rows.languageSub")} onClick={toggleLang} />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-sm font-semibold">{t("profile.recent")}</h2>
          </div>
          <div className="glass shadow-soft divide-y divide-border rounded-2xl overflow-hidden">
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{tx.label}</p>
                  <p className="text-[11px] text-muted-foreground">{tx.date}</p>
                </div>
                <p className={tx.amount < 0 ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-success"}>
                  {tx.amount < 0 ? "" : "+"}{tx.amount} cr
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { appStore.reset(); navigate("/"); }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition-smooth hover:bg-destructive/15"
        >
          <LogOut className="h-4 w-4" /> {t("common.signOut")}
        </button>
      </div>

      {sheet && (
        <VehicleSheet
          initial={editingVehicle}
          isAdd={sheet.mode === "add"}
          onCancel={() => setSheet(null)}
          onSave={(data) => saveVehicle(data, sheet.mode === "edit" ? sheet.id : undefined)}
        />
      )}
    </PhoneShell>
  );
}

function CarSilhouette({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 60 30" className="h-7 w-10 shrink-0">
      <path
        d="M4 20 Q5 14 10 12 L18 9 Q24 7 32 7 L42 7 Q50 7 54 14 L56 19 Q57 22 54 23 L50 23 Q49 19 44 19 Q39 19 38 23 L22 23 Q21 19 16 19 Q11 19 10 23 L7 23 Q3 23 4 20 Z"
        fill={fill}
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
      <circle cx="16" cy="23" r="3" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.2" />
      <circle cx="44" cy="23" r="3" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.2" />
    </svg>
  );
}

function Row({
  icon: Icon, label, sub, onClick,
}: { icon: typeof Bell; label: string; sub: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass shadow-soft flex w-full items-center gap-3 rounded-2xl p-3 text-start transition-smooth hover:border-primary/40"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
    </button>
  );
}

/* ---------- Vehicle add/edit sheet ---------- */

function VehicleSheet({
  initial, isAdd, onCancel, onSave,
}: {
  initial: Vehicle | null;
  isAdd: boolean;
  onCancel: () => void;
  onSave: (data: Omit<Vehicle, "id">) => void;
}) {
  const { t } = useTranslation();
  const [plate, setPlate] = useState(initial?.plate ?? "");
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(initial?.year ?? "2024");
  const [color, setColor] = useState<VColor>((initial?.color as VColor) ?? "silver");
  const [isPrimary, setIsPrimary] = useState(initial?.isPrimary ?? isAdd);

  const canSave = plate.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={isAdd ? t("vehicles.addTitle") : t("vehicles.editTitle")}>
      <button
        aria-label={t("common.cancel")}
        onClick={onCancel}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="glass-strong shadow-elevated max-h-[85vh] overflow-y-auto rounded-t-3xl p-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
          <h3 className="text-lg font-semibold">{isAdd ? t("vehicles.addTitle") : t("vehicles.editTitle")}</h3>

          <div className="mt-4 space-y-3">
            <Field
              label={t("vehicles.plate")}
              value={plate}
              onChange={(v) => setPlate(v.toUpperCase())}
              placeholder={t("vehicles.platePh")}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("vehicles.make")} value={make} onChange={setMake} placeholder={t("vehicles.makePh")} />
              <Field label={t("vehicles.model")} value={model} onChange={setModel} placeholder={t("vehicles.modelPh")} />
            </div>

            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("vehicles.year")}</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none transition-smooth focus:border-primary focus:shadow-glow"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>

            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("vehicles.color")}</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {VEHICLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={t(`vehicles.colors.${c}`)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-smooth",
                      color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary" : "border-border",
                    )}
                    style={{ background: COLOR_HEX[c] }}
                  >
                    {color === c && (
                      <Check className="h-3.5 w-3.5" style={{ color: c === "white" || c === "silver" ? "#1F2937" : "#fff" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
              <span className="text-sm font-medium">{t("vehicles.primaryToggle")}</span>
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium transition-smooth hover:bg-muted"
            >
              {t("common.cancel")}
            </button>
            <button
              disabled={!canSave}
              onClick={() => onSave({ plate: plate.trim(), make: make.trim(), model: model.trim(), year, color, isPrimary })}
              className="flex-[1.5] rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:opacity-40"
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none transition-smooth focus:border-primary focus:shadow-glow"
      />
    </label>
  );
}
