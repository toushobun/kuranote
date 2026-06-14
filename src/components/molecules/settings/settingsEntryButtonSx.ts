export const settingsEntryButtonSx = {
  "&:not(.Mui-disabled)": {
    background: "var(--user-theme-fab-bg)",
    color: "var(--user-theme-fab-text)",
  },
  "&:not(.Mui-disabled):hover": {
    // 覆盖 MUI 默认 hover 背景，让亮度滤镜统一作用于主题背景。
    background: "var(--user-theme-fab-bg)",
    filter: "brightness(0.92)",
  },
} as const;
