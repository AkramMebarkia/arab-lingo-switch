import { Link, Navigate } from "react-router-dom";
import { ArrowRight, MapPin, Sparkles, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/lib/app-store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function Landing() {
  const user = useAppState((s) => s.user);
  const { t } = useTranslation();
  if (user) return <Navigate to="/home" replace />;

  const features = [
    { icon: MapPin, text: t("landing.f1") },
    { icon: Zap, text: t("landing.f2") },
    { icon: Sparkles, text: t("landing.f3") },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute bottom-0 end-0 h-[300px] w-[300px] rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold tracking-tight">{t("app.name")}</span>
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("app.tagline")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <section className="mt-12 flex-1 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" /> {t("landing.chip")}
          </div>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight">
            {t("landing.title1")}
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {t("landing.title2")}
            </span>
          </h1>
          <p className="mt-4 max-w-sm text-balance text-base leading-relaxed text-muted-foreground">
            {t("landing.subtitle")}
          </p>

          <ul className="mt-8 space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <li
                key={i}
                className="glass shadow-soft flex items-center gap-3 rounded-2xl p-3 animate-fade-in"
                style={{ animationDelay: `${120 + i * 80}ms` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <Link
          to="/onboarding"
          className="group mt-8 flex items-center justify-center gap-2 rounded-2xl gradient-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
        >
          {t("landing.cta")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
