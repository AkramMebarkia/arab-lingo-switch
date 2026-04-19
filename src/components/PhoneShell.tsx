import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface PhoneShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function PhoneShell({ children, hideNav }: PhoneShellProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
        <main className={hideNav ? "flex-1" : "flex-1 pb-28"}>{children}</main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
