import type { UserThemeKey } from "./userThemeTokens";

type UserTransactionThemeTokens = {
  summaryBackground: string;
  navBackground: string;
  avatarBackground: string;
  accent: string;
  border: string;
};

export const userTransactionThemeTokens: Record<
  UserThemeKey,
  UserTransactionThemeTokens
> = {
  lavender_dream: {
    summaryBackground: "#e8e0f8",
    navBackground: "#f4efff",
    avatarBackground: "#f4efff",
    accent: "#6d4bb3",
    border: "#e5dcf6",
  },
  jade_morning_dew: {
    summaryBackground: "#d1fae5",
    navBackground: "#ecfeff",
    avatarBackground: "#d1fae5",
    accent: "#059669",
    border: "rgba(110, 231, 183, 0.4)",
  },
  sakura_story: {
    summaryBackground: "#fce7f3",
    navBackground: "#fff1f2",
    avatarBackground: "#ffe4e6",
    accent: "#f43f5e",
    border: "rgba(253, 164, 175, 0.42)",
  },
  deep_sea_starlight: {
    summaryBackground: "#e0e7ff",
    navBackground: "#eef2ff",
    avatarBackground: "#e0e7ff",
    accent: "#4f46e5",
    border: "rgba(129, 140, 248, 0.4)",
  },
  amber_sun: {
    summaryBackground: "#fef3c7",
    navBackground: "#ffedd5",
    avatarBackground: "#fef3c7",
    accent: "#d97706",
    border: "rgba(251, 191, 36, 0.42)",
  },
  rose_velvet_night: {
    summaryBackground: "#fae8ff",
    navBackground: "#fce7f3",
    avatarBackground: "#fae8ff",
    accent: "#c026d3",
    border: "rgba(232, 121, 249, 0.4)",
  },
  flame_red: {
    summaryBackground: "#fee2e2",
    navBackground: "#fff1f2",
    avatarBackground: "#fee2e2",
    accent: "#dc2626",
    border: "rgba(248, 113, 113, 0.42)",
  },
  lemon_gold: {
    summaryBackground: "#fef9c3",
    navBackground: "#f7fee7",
    avatarBackground: "#fef9c3",
    accent: "#ca8a04",
    border: "rgba(253, 224, 71, 0.45)",
  },
  indigo_ocean: {
    summaryBackground: "#dbeafe",
    navBackground: "#eff6ff",
    avatarBackground: "#dbeafe",
    accent: "#2563eb",
    border: "rgba(59, 130, 246, 0.4)",
  },
  white_porcelain: {
    summaryBackground: "#f1f5f9",
    navBackground: "#f8fafc",
    avatarBackground: "#f1f5f9",
    accent: "#64748b",
    border: "rgba(148, 163, 184, 0.32)",
  },
};
