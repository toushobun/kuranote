"use client";

import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import { ledgerInviteRoleLabels, type LedgerInviteRole } from "types/ledgers";

const roleContent: Record<
  LedgerInviteRole,
  { icon: ReactNode; label: string }
> = {
  admin: {
    icon: <AdminPanelSettingsRoundedIcon />,
    label: ledgerInviteRoleLabels.admin,
  },
  member: { icon: <PersonRoundedIcon />, label: ledgerInviteRoleLabels.member },
  viewer: {
    icon: <VisibilityRoundedIcon />,
    label: ledgerInviteRoleLabels.viewer,
  },
};

export function LedgerInviteRoleRow({
  onChange,
  role,
}: {
  onChange?: (role: LedgerInviteRole) => void;
  role: LedgerInviteRole;
}) {
  const { icon, label } = roleContent[role];
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <Stack direction="row" spacing={1.4} sx={{ alignItems: "center" }}>
      <Box sx={iconBoxSx}>{icon}</Box>
      <Stack spacing={0.3} sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="span" sx={labelSx}>
          权限
        </Typography>
        {onChange ? (
          <>
            <Button
              aria-haspopup="menu"
              aria-label={`选择邀请权限，当前为${label}`}
              endIcon={<ArrowDropDownRoundedIcon />}
              onClick={(event) => setAnchorEl(event.currentTarget)}
              size="small"
              sx={roleButtonSx}
            >
              {label}
            </Button>
            <Menu
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              open={anchorEl !== null}
            >
              {(Object.keys(roleContent) as LedgerInviteRole[]).map((value) => (
                <MenuItem
                  key={value}
                  onClick={() => {
                    onChange(value);
                    setAnchorEl(null);
                  }}
                  selected={value === role}
                >
                  {roleContent[value].label}
                </MenuItem>
              ))}
            </Menu>
          </>
        ) : (
          <Typography component="span" sx={valueSx}>
            {label}
          </Typography>
        )}
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

const roleButtonSx = {
  alignSelf: "flex-start",
  color: "text.primary",
  fontSize: 15,
  fontWeight: 800,
  justifyContent: "flex-start",
  minWidth: 0,
  mx: -1,
  my: -0.5,
  textTransform: "none",
};
