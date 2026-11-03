import { create } from "zustand";

export interface TimezoneEntry {
  id: string;
  timezone: string;
  label: string;
  country: string;
}

export type Theme = "light" | "dark";

const ZONES_KEY = "timezoned-zones";
const THEME_KEY = "timezoned-theme";

interface TimezoneState {
  zones: TimezoneEntry[];
  /** True once the zones have been loaded from URL, storage or page props. */
  hydrated: boolean;
  /** When false (embedded on a city page), zone changes are not written to localStorage. */
  persist: boolean;
  theme: Theme;
  currentTime: Date;
  dayOffset: number;
  hydrate: (zones: TimezoneEntry[], options?: { persist?: boolean }) => void;
  addZone: (zone: TimezoneEntry) => void;
  removeZone: (id: string) => void;
  replaceZone: (id: string, zone: TimezoneEntry) => void;
  reorderZones: (fromIndex: number, toIndex: number) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  tick: () => void;
  incrementDay: () => void;
  decrementDay: () => void;
  resetDay: () => void;
}

export function makeZoneId(timezone: string, label: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${timezone}-${label}-${rand}`.toLowerCase().replace(/[\s/]/g, "-");
}

export function readStoredZones(): TimezoneEntry[] | null {
  try {
    const stored = localStorage.getItem(ZONES_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.filter(
      (z): z is TimezoneEntry =>
        !!z && typeof z === "object" && typeof z.timezone === "string" && typeof z.label === "string"
    ).map((z) => ({ ...z, id: z.id || makeZoneId(z.timezone, z.label), country: z.country || "" }));
  } catch {
    return null;
  }
}

export function clearStoredZones() {
  try {
    localStorage.removeItem(ZONES_KEY);
  } catch {}
}

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function saveZones(zones: TimezoneEntry[], persist: boolean) {
  if (!persist || typeof window === "undefined") return;
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
  } catch {}
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export const useTimezoneStore = create<TimezoneState>((set) => ({
  zones: [],
  hydrated: false,
  persist: true,
  theme: "light",
  currentTime: new Date(),
  dayOffset: 0,

  hydrate: (zones, options) => {
    const persist = options?.persist ?? true;
    saveZones(zones, persist);
    set({ zones, persist, hydrated: true });
  },

  addZone: (zone) =>
    set((state) => {
      const zones = [...state.zones, zone];
      saveZones(zones, state.persist);
      return { zones };
    }),

  removeZone: (id) =>
    set((state) => {
      const zones = state.zones.filter((z) => z.id !== id);
      saveZones(zones, state.persist);
      return { zones };
    }),

  replaceZone: (id, zone) =>
    set((state) => {
      const zones = state.zones.map((z) => (z.id === id ? zone : z));
      saveZones(zones, state.persist);
      return { zones };
    }),

  reorderZones: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.zones.length ||
        toIndex >= state.zones.length
      ) {
        return {};
      }
      const zones = [...state.zones];
      const [moved] = zones.splice(fromIndex, 1);
      zones.splice(toIndex, 0, moved);
      saveZones(zones, state.persist);
      return { zones };
    }),

  toggleTheme: () =>
    set((state) => {
      const theme: Theme = state.theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      return { theme };
    }),

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  tick: () => set({ currentTime: new Date() }),

  incrementDay: () => set((state) => ({ dayOffset: state.dayOffset + 1 })),
  decrementDay: () => set((state) => ({ dayOffset: state.dayOffset - 1 })),
  resetDay: () => set({ dayOffset: 0 }),
}));
