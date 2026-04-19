import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const next = i18n.language === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      aria-label={t("languageToggle.aria")}
      onClick={() => i18n.changeLanguage(next)}
      className={cn(
        "glass-strong shadow-soft flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-3 text-foreground transition-smooth hover:scale-105",
        className,
      )}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-bold tracking-wide">
        {i18n.language === "ar" ? "EN" : "ع"}
      </span>
    </button>
  );
}
