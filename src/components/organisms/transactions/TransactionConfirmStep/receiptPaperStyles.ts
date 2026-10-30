import { designTokens } from "theme/theme";

// 小票纸片（#943），编辑记账的加载骨架（#962）共用。
// 锯齿高度为齿宽的一半；上下各一排，用 mask 裁出纸片边缘，不使用图片资源。
const toothWidth = 16;
const tornEdgeMask = [
  `conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / ${toothWidth}px 51% repeat-x`,
  `conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) top / ${toothWidth}px 51% repeat-x`,
].join(", ");

// mask 会裁掉 box-shadow，阴影改由外层 drop-shadow 沿纸片轮廓绘制。
export const receiptShadowSx = {
  filter: `drop-shadow(${designTokens.shadow.card})`,
};
export const receiptPaperSx = {
  bgcolor: "background.paper",
  mask: tornEdgeMask,
  WebkitMask: tornEdgeMask,
  px: 2,
  pt: 3,
  pb: 2.5,
};
