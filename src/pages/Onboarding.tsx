import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { appStore } from "@/lib/app-store";
import { type UserType } from "@/lib/mock-data";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";

const USER_TYPES: UserType[] = [
  "male-resident",
  "female-resident",
  "male-non-resident",
  "female-non-resident",
  "faculty",
  "staff",
  "handicap",
];

const EMOJI: Record<UserType, string> = {
  "male-resident": "🟢",
  "female-resident": "🩷",
  "male-non-resident": "🟣",
  "female-non-resident": "🩷",
  faculty: "🎓",
  staff: "💼",
  handicap: "♿",
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [plate, setPlate] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<UserType | null>(null);

  const stepLabels = [
    t("onboarding.steps.account"),
    t("onboarding.steps.vehicle"),
    t("onboarding.steps.you"),
  ];

  const canNext =
    (step === 0 && name.trim() && universityId.trim() && password.length >= 4) ||
    (step === 1 && plate.trim()) ||
    (step === 2 && type);

  const finish = () => {
    if (!type) return;
    appStore.set({
      user: { name: name.trim(), universityId: universityId.trim(), plate: plate.trim(), type },
    });
    navigate("/home");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 end-0 h-[360px] w-[360px] rounded-full bg-primary/25 blur-[110px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-8 pt-6">
        <header className="flex items-center justify-between">
          <button
            onClick={() => (step === 0 ? navigate("/") : setStep(step - 1))}
            className="glass flex h-10 w-10 items-center justify-center rounded-full transition-smooth hover:scale-105"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </button>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-6 flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className="flex-1">
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full gradient-primary transition-all duration-500",
                      i <= step ? "w-full" : "w-0",
                    )}
                  />
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex-1 animate-fade-in" key={step}>
          {step === 0 && (
            <Step title={t("onboarding.accountTitle")} subtitle={t("onboarding.accountSubtitle")}>
              <Field label={t("onboarding.fullName")} value={name} onChange={setName} placeholder={t("onboarding.fullNamePh")} />
              <Field label={t("onboarding.universityId")} value={universityId} onChange={setUniversityId} placeholder={t("onboarding.universityIdPh")} />
              <Field label={t("onboarding.password")} value={password} onChange={setPassword} placeholder={t("onboarding.passwordPh")} type="password" />
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("onboarding.privacy")}
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title={t("onboarding.vehicleTitle")} subtitle={t("onboarding.vehicleSubtitle")}>
              <Field label={t("onboarding.plate")} value={plate} onChange={setPlate} placeholder={t("onboarding.platePh")} />
            </Step>
          )}

          {step === 2 && (
            <Step title={t("onboarding.youTitle")} subtitle={t("onboarding.youSubtitle")}>
              <div className="grid grid-cols-2 gap-3">
                {USER_TYPES.map((u) => {
                  const active = type === u;
                  return (
                    <button
                      key={u}
                      onClick={() => setType(u)}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border p-4 text-start transition-smooth",
                        active ? "border-primary bg-primary/10 shadow-glow"
                               : "border-border bg-card/60 hover:border-primary/40 hover:bg-card",
                      )}
                    >
                      <div className="text-2xl">{EMOJI[u]}</div>
                      <p className="mt-2 text-sm font-semibold leading-tight">{t(`userTypes.${u}.label`)}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{t(`userTypes.${u}.tag`)}</p>
                      {active && (
                        <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full gradient-primary text-primary-foreground animate-scale-in">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Step>
          )}
        </div>

        <button
          disabled={!canNext}
          onClick={() => (step === 2 ? finish() : setStep(step + 1))}
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {step === 2 ? t("onboarding.enter") : t("common.continue")}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-sm outline-none transition-smooth focus:border-primary focus:shadow-glow"
      />
    </label>
  );
}
