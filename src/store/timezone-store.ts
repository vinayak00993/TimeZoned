import { create } from "zustand";

export interface TimezoneEntry {
  id: string;
  timezone: string;
  label: string;
  country: string;
}

interface TimezoneState {
  zones: TimezoneEntry[];
  hoveredHourIndex: number | null;
  theme: "dark" | "light";
  currentTime: Date;
  setZones: (zones: TimezoneEntry[]) => void;
  addZone: (zone: TimezoneEntry) => void;
  removeZone: (id: string) => void;
  reorderZones: (fromIndex: number, toIndex: number) => void;
  setHoveredHourIndex: (index: number | null) => void;
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
  tick: () => void;
}

const DEFAULT_ZONES: TimezoneEntry[] = [
  {
    id: "america-los_angeles",
    timezone: "America/Los_Angeles",
    label: "Los Angeles",
    country: "US",
  },
  {
    id: "asia-kolkata",
    timezone: "Asia/Kolkata",
    label: "Mumbai",
    country: "IN",
  },
];

function loadZones(): TimezoneEntry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("timezoned-zones");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveZones(zones: TimezoneEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("timezoned-zones", JSON.stringify(zones));
  } catch {}
}

function loadTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("timezoned-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "dark";
}

function saveTheme(theme: "dark" | "light") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("timezoned-theme", theme);
  } catch {}
}

export const useTimezoneStore = create<TimezoneState>((set) => ({
  zones: DEFAULT_ZONES,
  hoveredHourIndex: null,
  theme: "dark",
  currentTime: new Date(),

  setZones: (zones) => {
    saveZones(zones);
    set({ zones });
  },

  addZone: (zone) =>
    set((state) => {
      const newZones = [...state.zones, zone];
      saveZones(newZones);
      return { zones: newZones };
    }),

  removeZone: (id) =>
    set((state) => {
      const newZones = state.zones.filter((z) => z.id !== id);
      saveZones(newZones);
      return { zones: newZones };
    }),

  reorderZones: (fromIndex, toIndex) =>
    set((state) => {
      const newZones = [...state.zones];
      const [moved] = newZones.splice(fromIndex, 1);
      newZones.splice(toIndex, 0, moved);
      saveZones(newZones);
      return { zones: newZones };
    }),

  setHoveredHourIndex: (index) => set({ hoveredHourIndex: index }),

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      saveTheme(newTheme);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", newTheme === "dark");
      }
      return { theme: newTheme };
    }),

  setTheme: (theme) => {
    saveTheme(theme);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    set({ theme });
  },

  tick: () => set({ currentTime: new Date() }),
}));
