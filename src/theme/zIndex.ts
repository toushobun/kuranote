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

// 确认框可能从底部抽屉（账户选择、备注、时间等，与金额键盘同层）里弹出，
// 需要显示在这些抽屉之上；确认框总是由用户操作触发、处于最上层，仍低于反馈提示。
export const confirmDialogZIndex = amountKeypadZIndex + 10;
