// Lightweight client-only store for mock app state.
import { useSyncExternalStore } from "react";
import type { UserType } from "./mock-data";

export interface AppUser {
  name: string;
  universityId: string;
  plate: string;
  type: UserType;
}

export interface SavedCar {
  lotId: string;
  slotLabel: string;
  savedAt: number;
}

interface AppState {
  user: AppUser | null;
  credits: number;
  savedCar: SavedCar | null;
  theme: "light" | "dark";
}

const STORAGE_KEY = "kfupm-ps-state-v1";

function defaultState(): AppState {
  return { user: null, credits: 50, savedCar: null, theme: "dark" };
}

function load(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as Partial<AppState>) };
  } catch {
    return defaultState();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* noop */ }
}
function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const appStore = {
  get: () => state,
  set: (patch: Partial<AppState>) => { state = { ...state, ...patch }; emit(); },
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  reset: () => { state = defaultState(); emit(); },
};

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (l) => { const unsub = appStore.subscribe(l); return () => unsub(); },
    () => selector(state),
    () => selector(defaultState()),
  );
}

export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
