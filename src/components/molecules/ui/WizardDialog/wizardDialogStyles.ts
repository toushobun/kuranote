import { designTokens } from "theme/theme";

// 不带 "use client"：加载骨架等服务端组件也能复用同一外框尺寸与标题栏。
export const wizardDialogPaperSx = {
  borderRadius: `${designTokens.radius.xl}px`,
  height: "min(760px, calc(100% - 64px))",
  maxWidth: 560,
  overflow: "hidden",
};

export const wizardDialogHeaderSx = {
  borderBottom: "1px solid",
  borderColor: "divider",
  flexShrink: 0,
  pb: 2,
  pt: "calc(8px + env(safe-area-inset-top))",
  px: { xs: 1, sm: 2 },
};

// 标题栏下方没有其他内容（如进度条）时收紧下边距。
export const wizardDialogTitleOnlyHeaderSx = { pb: 1 };
export const wizardDialogTitleOnlyRowSx = { mb: 0 };

// 关闭按钮在左、标题居中：右侧留出与按钮等宽的空列。
export const wizardDialogTitleRowSx = {
  alignItems: "center",
  display: "grid",
  gridTemplateColumns: "40px 1fr 40px",
  mb: 1.5,
};

export const wizardDialogTitleSx = {
  color: "text.primary",
  fontSize: 17,
  fontWeight: 900,
  textAlign: "center",
};
