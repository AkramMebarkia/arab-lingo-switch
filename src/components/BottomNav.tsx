import { NavLink, useLocation } from "react-router-dom";
import { Home, Repeat, Car, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", labelKey: "nav.map", icon: Home },
  { to: "/trade", labelKey: "nav.trade", icon: Repeat },
  { to: "/find-car", labelKey: "nav.myCar", icon: Car },
  { to: "/profile", labelKey: "nav.profile", icon: User },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 pb-4 pt-2"
    >
      <div className="glass-strong shadow-elevated flex items-center justify-around rounded-3xl px-2 py-2">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-smooth",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/10" />}
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-medium tracking-wide">{t(labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
