import type { PaperProps } from "@mui/material/Paper";

import { designTokens } from "theme/theme";

import { SoftCard } from "./SoftCard";

// 数据卡片（账户、账本、分类、商家等）共用的内边距；整卡可点击时由内部按钮使用。
export const dataItemCardPadding = { xs: 1.5, sm: 1.75 } as const;

type DataItemCardProps = PaperProps & {
  disablePadding?: boolean;
};

// 内边距是响应式写法，在 sx 中写 p / py 等普通值会被它的 media query 覆盖而不生效；
// 需要调整内边距时先传 disablePadding，再在 sx 或内部元素上自行设置。
export function DataItemCard({
  disablePadding = false,
  sx,
  ...props
}: DataItemCardProps) {
  return (
    <SoftCard
      sx={[
        {
          borderRadius: `${designTokens.radius.md}px`,
          p: disablePadding ? 0 : dataItemCardPadding,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
