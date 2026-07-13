import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export type LedgerInviteRole = "member" | "viewer";

const roleContent: Record<
  LedgerInviteRole,
  { icon: ReactNode; label: string }
> = {
  member: { icon: <PersonRoundedIcon />, label: "用户（Member）" },
  viewer: { icon: <VisibilityRoundedIcon />, label: "只读（Viewer）" },
};

export function LedgerInviteRoleRow({ role }: { role: LedgerInviteRole }) {
  const { icon, label } = roleContent[role];

  return (
    <Stack direction="row" spacing={1.4} sx={{ alignItems: "center" }}>
      <Box sx={iconBoxSx}>{icon}</Box>
      <Stack spacing={0.3} sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="span" sx={labelSx}>
          默认权限
        </Typography>
        <Typography component="span" sx={valueSx}>
          {label}
        </Typography>
      </Stack>
    </Stack>
  );
}

const iconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 44,
  justifyContent: "center",
  width: 44,
  "& .MuiSvgIcon-root": {
    fontSize: 24,
  },
} as const;

const labelSx = {
  color: "text.secondary",
  fontSize: 13,
  fontWeight: 700,
};

const valueSx = {
  fontSize: 15,
  fontWeight: 800,
};
