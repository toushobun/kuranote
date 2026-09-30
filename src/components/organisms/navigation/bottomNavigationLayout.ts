import { appZIndex } from "theme/zIndex";

const bottomNavigationReservePx = 80;
// 通用页面只需要避开固定底部导航栏本体与 iPhone home indicator。
const shellPaddingBottom = `calc(${bottomNavigationReservePx}px + env(safe-area-inset-bottom))`;

export const bottomNavigationLayout = {
  // 底部导航主体约 64px，中央快速记账图标会向上溢出，因此首页内容区额外预留空间。
  dashboardContentPaddingBottom: {
    xs: "calc(96px + env(safe-area-inset-bottom))",
    sm: "calc(104px + env(safe-area-inset-bottom))",
  },
  // 操作反馈提示条距底部的位置，避开底部导航栏。
  feedbackBottomOffset: `calc(${shellPaddingBottom} + 8px)`,
  // 高于 MUI Menu / Popover 默认层级，低于 Dialog / Modal。
  navigationZIndex: appZIndex.bottomNavigation,
  safeAreaPaddingBottom: "env(safe-area-inset-bottom)",
  shellPaddingBottom,
  shellPaddingBottomOffset: `calc(-${bottomNavigationReservePx}px - env(safe-area-inset-bottom))`,
} as const;
