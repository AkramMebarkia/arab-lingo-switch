import { Navigate, useNavigate } from "react-router-dom";
import {
  Bell, Car, ChevronRight, CreditCard, HelpCircle, Languages, LogOut, Plus, Receipt, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PhoneShell } from "@/components/PhoneShell";
import { appStore, useAppState } from "@/lib/app-store";
import { TRANSACTIONS } from "@/lib/mock-data";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function ProfilePage() {
  const user = useAppState((s) => s.user);
  const credits = useAppState((s) => s.credits);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  if (!user) return <Navigate to="/" replace />;

  const handleTopUp = () => {
    const next = (appStore.get().credits ?? 0) + 50;
    appStore.set({ credits: next });
    toast.success(t("profile.topUpToast"), { description: t("profile.topUpDesc", { n: next }) });
  };

  const toggleLang = () => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");

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

        <div className="mt-3 space-y-2">
          <Row icon={Car} label={t("profile.rows.vehicle")} sub={user.plate} />
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
            {TRANSACTIONS.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.date}</p>
                </div>
                <p className={t.amount < 0 ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-success"}>
                  {t.amount < 0 ? "" : "+"}{t.amount} cr
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
    </PhoneShell>
  );
}

function Row({
  icon: Icon, label, sub, onClick,
}: { icon: typeof Car; label: string; sub: string; onClick?: () => void }) {
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
