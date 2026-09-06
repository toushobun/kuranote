import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { designTokens } from "theme/theme";

type InlineHintProps = {
  children: ReactNode;
  variant?: "filled" | "plain";
};

export function InlineHint({ children, variant = "filled" }: InlineHintProps) {
  return (
    <Stack
      direction="row"
      spacing={0.9}
      sx={{
        alignItems: "center",
        ...(variant === "filled"
          ? {
              bgcolor: "action.hover",
              borderRadius: `${designTokens.radius.md}px`,
              px: 1.25,
              py: 1,
            }
          : {}),
      }}
    >
      <TipsAndUpdatesOutlinedIcon
        sx={{
          color: "var(--user-theme-action-text)",
          flexShrink: 0,
          fontSize: 22,
        }}
      />
      <Typography color="text.secondary" variant="body2">
        {children}
      </Typography>
    </Stack>
  );
}
