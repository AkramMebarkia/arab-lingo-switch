import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { appStore, applyTheme, useAppState } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useAppState((s) => s.theme);
  const { t } = useTranslation();

  useEffect(() => { applyTheme(theme); }, [theme]);

  return (
    <button
      type="button"
      aria-label={t("themeToggle.aria")}
      onClick={() => appStore.set({ theme: theme === "dark" ? "light" : "dark" })}
      className={cn(
        "glass-strong shadow-soft flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-smooth hover:scale-105",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
