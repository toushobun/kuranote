"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type KeyboardEvent } from "react";

import { merchantText } from "config/merchantText";
import { useBackLayer } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { designTokens } from "theme/theme";

export type MerchantAliasDraft = { id: string; alias: string };

type MerchantDisplayNameDrawerProps = {
  aliases: MerchantAliasDraft[];
  merchantName: string;
  onClose: () => void;
  onConfirm: (
    aliases: MerchantAliasDraft[],
    preferredAliasId: string | null,
  ) => void;
  preferredAliasId: string | null;
};

const rowSx = {
  alignItems: "center",
  display: "flex",
  gap: 1,
  minHeight: 56,
  px: 2,
  py: 1,
} as const;

export function MerchantDisplayNameDrawer({
  aliases,
  merchantName,
  onClose,
  onConfirm,
  preferredAliasId,
}: MerchantDisplayNameDrawerProps) {
  const confirm = useConfirmDialog();
  useBackLayer(true, onClose);
  const [draftAliases, setDraftAliases] = useState(aliases);
  const [selectedId, setSelectedId] = useState<string | null>(preferredAliasId);
  const [newAlias, setNewAlias] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addAlias() {
    const value = newAlias.trim();
    if (!value) {
      setError(merchantText.aliasEmptyError);
      return;
    }
    const normalized = value.toLowerCase();
    if (
      normalized === merchantName.trim().toLowerCase() ||
      draftAliases.some((alias) => alias.alias.toLowerCase() === normalized)
    ) {
      setError(merchantText.aliasDuplicateError);
      return;
    }
    setDraftAliases((current) => [
      ...current,
      { id: `new:${crypto.randomUUID()}`, alias: value },
    ]);
    setNewAlias("");
    setError(null);
  }

  function addOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addAlias();
  }

  async function removeAlias(alias: MerchantAliasDraft) {
    const accepted = await confirm({
      title: merchantText.archiveAliasConfirmTitleFor(alias.alias),
      description: merchantText.archiveAliasSaveDescription,
      confirmLabel: merchantText.deleteAlias,
      cancelLabel: merchantText.cancel,
      tone: "delete",
    });
    if (!accepted) return;
    setDraftAliases((current) =>
      current.filter((item) => item.id !== alias.id),
    );
    setSelectedId((current) => (current === alias.id ? null : current));
  }

  function nameRow(label: string, id: string | null) {
    const selected = selectedId === id;
    return (
      <ButtonBase
        aria-label={merchantText.displayNameOptionLabel(label, selected)}
        aria-pressed={selected}
        onClick={() => setSelectedId(id)}
        sx={{
          ...rowSx,
          textAlign: "left",
          width: "100%",
          "&:active": { bgcolor: "action.selected" },
          "@media (hover: hover)": {
            "&:hover": { bgcolor: "action.hover" },
          },
        }}
      >
        <Box sx={{ width: 24, flexShrink: 0 }}>
          {selected ? (
            <CheckRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
          ) : null}
        </Box>
        <Typography
          sx={{
            color: selected ? "primary.main" : "text.primary",
            fontWeight: selected ? 800 : 400,
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {label}
        </Typography>
      </ButtonBase>
    );
  }

  return (
    <Drawer
      anchor="bottom"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${designTokens.radius.lg}px ${designTokens.radius.lg}px 0 0`,
            maxHeight: "90dvh",
          },
        },
      }}
    >
      <Stack
        spacing={2}
        sx={{
          p: 2,
          pb: "max(16px, env(safe-area-inset-bottom))",
          overflowY: "auto",
        }}
      >
        <Box
          aria-hidden
          sx={{
            alignSelf: "center",
            bgcolor: "divider",
            borderRadius: `${designTokens.radius.full}px`,
            height: 4,
            width: 44,
          }}
        />
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {merchantText.preferredTitle}
          </Typography>
          <IconButton
            aria-label={merchantText.closeDisplayName}
            onClick={onClose}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
        <Typography color="textSecondary" variant="body2">
          {merchantText.preferredHelper}
        </Typography>

        <Stack spacing={0.75}>
          <Typography variant="subtitle2">
            {merchantText.formalNameTitle}
          </Typography>
          <Box
            sx={{
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              borderRadius: `${designTokens.radius.item}px`,
              overflow: "hidden",
            }}
          >
            {nameRow(merchantName, null)}
          </Box>
        </Stack>
        <Stack spacing={0.75}>
          <Typography variant="subtitle2">{merchantText.aliasLabel}</Typography>
          {draftAliases.length ? (
            <Box
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: `${designTokens.radius.item}px`,
                overflow: "hidden",
              }}
            >
              {draftAliases.map((alias, index) => (
                <Stack
                  key={alias.id}
                  direction="row"
                  sx={{
                    alignItems: "center",
                    borderTop: index ? 1 : 0,
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {nameRow(alias.alias, alias.id)}
                  </Box>
                  <IconButton
                    aria-label={merchantText.removeAliasLabel(alias.alias)}
                    onClick={() => void removeAlias(alias)}
                    size="small"
                    sx={{ bgcolor: "action.hover", mr: 1.5 }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary" variant="body2">
              {merchantText.aliasEmptyHint}
            </Typography>
          )}
        </Stack>

        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1}>
            <TextField
              autoComplete="off"
              error={Boolean(error)}
              fullWidth
              onBlur={() => {
                if (newAlias.length > 0 && !newAlias.trim())
                  setError(merchantText.aliasEmptyError);
              }}
              onChange={(event) => {
                setNewAlias(event.target.value);
                setError(null);
              }}
              onKeyDown={addOnEnter}
              placeholder={merchantText.newAliasPlaceholder}
              size="small"
              slotProps={{
                htmlInput: {
                  maxLength: 100,
                  "aria-label": merchantText.newAliasPlaceholder,
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${designTokens.radius.item}px`,
                },
              }}
              value={newAlias}
            />
            <Button
              disabled={!newAlias.trim()}
              onClick={addAlias}
              startIcon={<AddRoundedIcon />}
              sx={{
                borderRadius: `${designTokens.radius.item}px`,
                flexShrink: 0,
              }}
              variant="outlined"
            >
              {merchantText.addAliasShort}
            </Button>
          </Stack>
          {error ? (
            <Typography color="error" role="alert" variant="caption">
              {error}
            </Typography>
          ) : null}
        </Stack>
        <Button
          fullWidth
          onClick={() => onConfirm(draftAliases, selectedId)}
          sx={{ borderRadius: `${designTokens.radius.full}px` }}
          variant="contained"
        >
          {merchantText.confirmDisplayName}
        </Button>
      </Stack>
    </Drawer>
  );
}
