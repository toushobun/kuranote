"use client";

import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { typographyStyles } from "theme/typographyTokens";

export type ListRowButtonProps = {
  avatar: ReactNode;
  avatarSx?: SxProps<Theme>;
  disabled?: boolean;
  onClick?: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
  trailing?: ReactNode;
  type?: ButtonProps["type"];
};

export function ListRowButton({
  avatar,
  avatarSx,
  disabled = false,
  onClick,
  subtitle,
  title,
  trailing,
  type = "button",
}: ListRowButtonProps) {
  return (
    <Button
      disabled={disabled}
      fullWidth
      onClick={onClick}
      sx={rowButtonSx}
      type={type}
    >
      <Box
        sx={[
          defaultAvatarSx,
          ...(Array.isArray(avatarSx) ? avatarSx : [avatarSx]),
        ]}
      >
        {avatar}
      </Box>
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="span" noWrap sx={titleSx}>
          {title}
        </Typography>
        {subtitle}
      </Stack>
      {trailing}
    </Button>
  );
}

const rowButtonSx = {
  alignItems: "center",
  borderRadius: 2,
  color: "text.primary",
  gap: 1.3,
  justifyContent: "flex-start",
  minHeight: 58,
  p: 0,
  textAlign: "left",
  textTransform: "none",
  "&:hover": {
    bgcolor: "action.hover",
  },
} as const;

const defaultAvatarSx: SxProps<Theme> = {
  alignItems: "center",
  bgcolor: "action.hover",
  borderRadius: "50%",
  color: "text.secondary",
  display: "inline-flex",
  flexShrink: 0,
  height: 44,
  justifyContent: "center",
  width: 44,
  "& .MuiSvgIcon-root": {
    fontSize: 26,
  },
};

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 16,
  fontWeight: 900,
};
