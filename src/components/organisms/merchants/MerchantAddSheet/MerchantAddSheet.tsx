"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { Theme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useId } from "react";
import { merchantPresetMessages as messages } from "config/merchantPresetMessages";
import { routePaths } from "config/paths";
import { appZIndex } from "theme/zIndex";
import { designTokens } from "theme/theme";

export function MerchantAddSheet({
  onClose,
  onPreset,
  open,
}: {
  onClose: () => void;
  onPreset: () => void;
  open: boolean;
}) {
  const titleId = useId();
  return (
    <Drawer
      sx={{ zIndex: appZIndex.bottomSheet }}
      anchor="bottom"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-labelledby": titleId,
          sx: {
            mx: "auto",
            width: "100%",
            maxWidth: 560,
            borderTopLeftRadius: `${designTokens.radius.xl}px`,
            borderTopRightRadius: `${designTokens.radius.xl}px`,
            p: 2,
            pb: (theme) =>
              `calc(${theme.spacing(2)} + env(safe-area-inset-bottom))`,
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          component="h2"
          id={titleId}
          sx={{ fontWeight: 800 }}
          variant="h6"
        >
          {messages.chooserTitle}
        </Typography>
        <IconButton aria-label={messages.close} onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>
      <List sx={{ display: "grid", gap: 1 }}>
        <ListItemButton onClick={onPreset} sx={choiceSx}>
          <ListItemIcon sx={choiceIconSx}>
            <StorefrontRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary={messages.fromPreset}
            secondary={messages.presetDescription}
          />
          <ChevronRightRoundedIcon color="action" />
        </ListItemButton>
        <ListItemButton
          component={Link}
          href={routePaths.merchantsNew}
          sx={choiceSx}
        >
          <ListItemIcon sx={choiceIconSx}>
            <EditRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary={messages.manual}
            secondary={messages.manualDescription}
          />
          <ChevronRightRoundedIcon color="action" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}

const choiceSx = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.item}px`,
  p: 2,
};
const choiceIconSx = {
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  color: "var(--user-theme-action-text)",
  borderRadius: "50%",
  minWidth: (theme: Theme) => theme.spacing(5),
  height: (theme: Theme) => theme.spacing(5),
  mr: 2,
};
