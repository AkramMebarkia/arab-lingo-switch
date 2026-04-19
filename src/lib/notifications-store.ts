// Notifications store — same useSyncExternalStore + localStorage pattern as app-store.
import { useSyncExternalStore } from "react";

export type NotificationType = "trade" | "reroute" | "curfew" | "lot-full";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  lotId?: string;
}

interface NotificationsState {
  notifications: Notification[];
}

const STORAGE_KEY = "kfupm-ps-notifications-v1";
const MAX = 30;

function defaultState(): NotificationsState {
  return { notifications: [] };
}

function load(): NotificationsState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as Partial<NotificationsState>) };
  } catch {
    return defaultState();
  }
}

let state: NotificationsState = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* noop */ }
}
function emit() { persist(); listeners.forEach((l) => l()); }

export const notificationsStore = {
  get: () => state,
  set: (patch: Partial<NotificationsState>) => { state = { ...state, ...patch }; emit(); },
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },

  add: (n: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newN: Notification = {
      ...n,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      read: false,
    };
    state = { notifications: [newN, ...state.notifications].slice(0, MAX) };
    emit();
  },
  markRead: (id: string) => {
    state = {
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    };
    emit();
  },
  markAllRead: () => {
    state = { notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    emit();
  },
  remove: (id: string) => {
    state = { notifications: state.notifications.filter((n) => n.id !== id) };
    emit();
  },
  clear: () => { state = defaultState(); emit(); },
};

export function useNotifications<T>(selector: (s: NotificationsState) => T): T {
  return useSyncExternalStore(
    (l) => { const unsub = notificationsStore.subscribe(l); return () => unsub(); },
    () => selector(state),
    () => selector(defaultState()),
  );
}

export function relativeTime(ts: number, lang: "en" | "ar" = "en"): string {
  const diffMs = Date.now() - ts;
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (lang === "ar") {
    if (sec < 30) return "الآن";
    if (min < 1) return `قبل ${sec} ث`;
    if (min < 60) return `قبل ${min} د`;
    if (hr < 24) return `قبل ${hr} س`;
    return `قبل ${day} ي`;
  }
  if (sec < 30) return "just now";
  if (min < 1) return `${sec} sec ago`;
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr ago`;
  return `${day} d ago`;
}
