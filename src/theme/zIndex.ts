export const appZIndex = {
  bottomNavigation: 1400,
  bottomSheet: 1420,
  dialog: 1500,
  dropdown: 1520,
  snackbar: 1580,
  tooltip: 1600,
} as const;

// 金额键盘以 Drawer 形式弹出，且可能在账户编辑等 Dialog 场景内触发，
// 需要明确高于 dialog / dropdown，故在 dropdown 基础上派生，
// 避免直接抬高全局 bottomSheet 层级、影响其他底部弹层。
export const amountKeypadZIndex = appZIndex.dropdown + 30;

// iOS PWA 状态栏遮罩需要恒定盖在包括 Tooltip 在内的所有内容之上，
// 保证 black-translucent 状态栏的白色图标在任意页面背景下都可读，
// 故在最高层级 tooltip 基础上派生。
export const statusBarScrimZIndex = appZIndex.tooltip + 20;
