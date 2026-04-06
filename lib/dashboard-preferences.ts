export type DashboardThemeId =
  | "crimson"
  | "ocean"
  | "emerald"
  | "sunset"
  | "violet"
  | "graphite"
  | "rose";

export type DashboardWidgetType =
  | "today-overview"
  | "upcoming-deadlines"
  | "my-tasks"
  | "announcements"
  | "my-clubs"
  | "calendar"
  | "activity-feed"
  | "pinned-items";

export type DashboardWidgetSize = 3 | 6 | 12;

export interface DashboardLayoutWidget {
  id: string;
  type: DashboardWidgetType;
  size: DashboardWidgetSize;
}

export const DASHBOARD_THEME_STORAGE_KEY = "hawklife-dashboard-theme";

export const DASHBOARD_THEMES: Array<{
  id: DashboardThemeId;
  name: string;
  description: string;
  preview: string;
}> = [
  {
    id: "crimson",
    name: "Prep Crimson",
    description: "Warm, polished, and close to the current HawkLife feel.",
    preview: "linear-gradient(135deg, #991b1b 0%, #f97316 55%, #facc15 100%)",
  },
  {
    id: "ocean",
    name: "Ocean Glass",
    description: "Cool blue surfaces with strong contrast and a calmer mood.",
    preview: "linear-gradient(135deg, #0f172a 0%, #0ea5e9 52%, #7dd3fc 100%)",
  },
  {
    id: "emerald",
    name: "Emerald Studio",
    description: "Fresh green accents with soft neutrals and readable panels.",
    preview: "linear-gradient(135deg, #064e3b 0%, #10b981 52%, #a7f3d0 100%)",
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    description: "Copper and amber tones with a bright editorial finish.",
    preview: "linear-gradient(135deg, #7c2d12 0%, #f97316 50%, #fde68a 100%)",
  },
  {
    id: "violet",
    name: "Violet Night",
    description: "Deep indigo and lilac with crisp foreground contrast.",
    preview: "linear-gradient(135deg, #312e81 0%, #7c3aed 52%, #c4b5fd 100%)",
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "Minimal monochrome with subtle steel-blue highlights.",
    preview: "linear-gradient(135deg, #111827 0%, #475569 50%, #cbd5e1 100%)",
  },
  {
    id: "rose",
    name: "Rose Quartz",
    description: "Soft blush and berry accents without sacrificing clarity.",
    preview: "linear-gradient(135deg, #881337 0%, #ec4899 50%, #fbcfe8 100%)",
  },
] as const;

export const DEFAULT_DASHBOARD_THEME: DashboardThemeId = "crimson";

export const DASHBOARD_WIDGET_SIZES: DashboardWidgetSize[] = [3, 6, 12];

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutWidget[] = [
  { id: "widget-today-overview", type: "today-overview", size: 6 },
  { id: "widget-upcoming-deadlines", type: "upcoming-deadlines", size: 6 },
  { id: "widget-my-tasks", type: "my-tasks", size: 12 },
];

export function getDashboardLayoutStorageKey(userId: string) {
  return `hawklife-dashboard-layout:${userId}`;
}

export function clampWidgetSize(size: number): DashboardWidgetSize {
  if (size <= 3) return 3;
  if (size <= 6) return 6;
  return 12;
}

