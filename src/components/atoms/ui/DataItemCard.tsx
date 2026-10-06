import type { PaperProps } from "@mui/material/Paper";

import { designTokens } from "theme/theme";

import { SoftCard } from "./SoftCard";

// 数据卡片（账户、账本、分类、商家等）共用的内边距；整卡可点击时由内部按钮使用。
export const dataItemCardPadding = { xs: 1.5, sm: 1.75 } as const;

type DataItemCardProps = PaperProps & {
  disablePadding?: boolean;
};

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
