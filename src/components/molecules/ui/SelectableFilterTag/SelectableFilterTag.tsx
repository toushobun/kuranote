import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";

import { designTokens } from "theme/theme";

export type SelectableFilterTagProps = {
  ariaLabel: string;
  count: number;
  href: string;
  icon: ReactNode;
  label: string;
  selected?: boolean;
};

export function SelectableFilterTag({
  ariaLabel,
  count,
  href,
  icon,
  label,
  selected = false,
}: SelectableFilterTagProps) {
  return (
    <ButtonBase
      aria-current={selected ? "page" : undefined}
      aria-label={ariaLabel}
      component={Link}
      href={href}
      sx={{
        bgcolor: selected ? "action.selected" : "background.paper",
        border: 1,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: `${designTokens.radius.item}px`,
        color: selected ? "primary.main" : "text.primary",
        flexDirection: "row",
        flexShrink: 0,
        gap: 1,
        minHeight: 56,
        overflow: "hidden",
        px: 1.25,
        py: 0.75,
        whiteSpace: "nowrap",
        "&:hover": {
          bgcolor: "action.hover",
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          alignItems: "center",
          bgcolor: "var(--user-theme-icon-badge-bg)",
          borderRadius: `${designTokens.radius.sm}px`,
          display: "flex",
          fontSize: "1.6rem",
          height: 40,
          justifyContent: "center",
          width: 40,
        }}
      >
        {icon}
      </Box>
      <Typography
        component="span"
        noWrap
        sx={{ fontWeight: 700, maxWidth: "100%" }}
        variant="body2"
      >
        {label}
      </Typography>
      <Box
        aria-hidden
        component="span"
        sx={{
          alignItems: "center",
          bgcolor: "var(--user-theme-icon-badge-bg)",
          borderRadius: `${designTokens.radius.full}px`,
          color: selected ? "primary.main" : "text.secondary",
          display: "flex",
          fontSize: "0.6875rem",
          fontWeight: 800,
          height: 22,
          justifyContent: "center",
          minWidth: 22,
          px: 0.5,
        }}
      >
        {count}
      </Box>
    </ButtonBase>
  );
}
