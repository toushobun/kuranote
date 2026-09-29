"use client";

import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";

import { ledgerNicknameSyncDialogMessages as text } from "config/settingsMessages";
import type { UserLedgerDisplayName } from "internal/user";
import { designTokens } from "theme/theme";

type LedgerNicknameSyncDialogProps = {
  displayName: string;
  ledgers: readonly UserLedgerDisplayName[];
  onClose: () => void;
  onConfirm: () => void;
  onOnlyPersonal: () => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onToggle: (ledgerId: string) => void;
  open: boolean;
  pending: boolean;
  selectedLedgerIds: ReadonlySet<string>;
};

/** 修改昵称时询问是否同步修改各账本内的昵称；勾选状态由调用方管理。 */
export function LedgerNicknameSyncDialog({
  displayName,
  ledgers,
  onClose,
  onConfirm,
  onOnlyPersonal,
  onSelectAll,
  onSelectNone,
  onToggle,
  open,
  pending,
  selectedLedgerIds,
}: LedgerNicknameSyncDialogProps) {
  const titleId = useId();

  return (
    <Dialog
      aria-labelledby={titleId}
      fullWidth
      maxWidth="xs"
      onClose={pending ? undefined : onClose}
      open={open}
    >
      <DialogTitle id={titleId}>{text.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.25}>
          <Typography color="text.secondary" variant="body2">
            {text.description(displayName)}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              disabled={pending}
              onClick={onSelectAll}
              size="small"
              type="button"
            >
              {text.selectAll}
            </Button>
            <Button
              disabled={pending}
              onClick={onSelectNone}
              size="small"
              type="button"
            >
              {text.selectNone}
            </Button>
          </Stack>
          <List aria-label={text.listLabel} disablePadding sx={listSx}>
            {ledgers.map((ledger) => {
              const labelId = `${titleId}-${ledger.ledgerId}`;

              return (
                <ListItem disablePadding key={ledger.ledgerId}>
                  <ListItemButton
                    disabled={pending}
                    onClick={() => onToggle(ledger.ledgerId)}
                    sx={listItemButtonSx}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox
                        checked={selectedLedgerIds.has(ledger.ledgerId)}
                        disableRipple
                        edge="start"
                        slotProps={{
                          input: { "aria-labelledby": labelId },
                        }}
                        tabIndex={-1}
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={labelId}
                      primary={ledger.ledgerName}
                      secondary={text.currentNickname(ledger.displayName)}
                      slotProps={{
                        primary: { noWrap: true },
                        secondary: { noWrap: true },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Stack>
      </DialogContent>
      <DialogActions sx={actionsSx}>
        <Button
          disabled={pending}
          onClick={onOnlyPersonal}
          type="button"
          variant="outlined"
        >
          {text.onlyPersonal}
        </Button>
        <Button
          disabled={pending}
          onClick={onConfirm}
          startIcon={
            pending ? <CircularProgress color="inherit" size={18} /> : undefined
          }
          type="button"
          variant="contained"
        >
          {text.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const listSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: `${designTokens.radius.item}px`,
  maxHeight: 320,
  overflowY: "auto",
};

const listItemButtonSx = {
  py: 0.5,
};

const actionsSx = {
  px: 3,
  pb: 2.5,
};
