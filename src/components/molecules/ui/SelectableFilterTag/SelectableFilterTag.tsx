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
        bgcolor: selected ? "primary.main" : "background.paper",
        border: 1,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: `${designTokens.radius.item}px`,
        color: selected ? "common.white" : "text.primary",
        flexDirection: "column",
        gap: 0.75,
        minHeight: 92,
        overflow: "hidden",
        position: "relative",
        px: 1,
        py: 1.25,
        width: { xs: 86, sm: 96 },
        "&:hover": {
          bgcolor: selected ? "primary.dark" : "action.hover",
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          alignItems: "center",
          bgcolor: selected
            ? "rgba(255, 255, 255, 0.2)"
            : "var(--user-theme-icon-badge-bg)",
          borderRadius: `${designTokens.radius.sm}px`,
          display: "flex",
          fontSize: "1.6rem",
          height: 44,
          justifyContent: "center",
          width: 44,
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
          bgcolor: selected ? "primary.contrastText" : "primary.main",
          borderRadius: `${designTokens.radius.full}px`,
          color: selected ? "primary.main" : "primary.contrastText",
          display: "flex",
          fontSize: "0.6875rem",
          fontWeight: 800,
          height: 22,
          justifyContent: "center",
          minWidth: 22,
          px: 0.5,
          position: "absolute",
          right: 6,
          top: 6,
        }}
      >
        {count}
      </Box>
    </ButtonBase>
  );
}
