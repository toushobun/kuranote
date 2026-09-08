"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRef, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";

import { merchantText } from "config/merchantText";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type { Merchant } from "types/merchants";

type MerchantNameOption = {
  id: string;
  isFormalName: boolean;
  label: string;
  selected: boolean;
};

function MerchantNameOptionButton({
  disabled,
  isRow,
  option,
}: {
  disabled: boolean;
  isRow: boolean;
  option: MerchantNameOption;
}) {
  const { pending: formPending } = useFormStatus();
  const { id, isFormalName, label, selected } = option;
  const optionRadius = isRow
    ? designTokens.radius.item
    : designTokens.radius.sm;

  return (
    <ButtonBase
      aria-label={merchantText.displayNameOptionLabel(label, selected)}
      aria-pressed={selected}
      disabled={disabled || formPending}
      name={isRow ? undefined : "aliasId"}
      type="submit"
      value={isRow ? undefined : id}
      sx={{
        "&.Mui-focusVisible": {
          outline: "auto",
          outlineOffset: (theme) => theme.spacing(0.25),
        },
        "&:active": {
          bgcolor: isRow
            ? "action.selected"
            : selected
              ? "primary.dark"
              : "action.selected",
        },
        "&:hover": {
          bgcolor: isRow
            ? "action.hover"
            : selected
              ? "primary.main"
              : "action.hover",
        },
        bgcolor: isRow
          ? "transparent"
          : selected
            ? "primary.main"
            : "transparent",
        border: isRow ? 0 : 1,
        borderColor: isRow
          ? "transparent"
          : selected
            ? "primary.main"
            : "divider",
        borderRadius: `${optionRadius}px`,
        color: isRow
          ? "text.primary"
          : selected
            ? "primary.contrastText"
            : "text.primary",
        display: "flex",
        gap: 0.75,
        justifyContent: "flex-start",
        minHeight: (theme) => theme.spacing(isRow ? 5 : 3.5),
        px: isRow ? 1.25 : 1,
        py: isRow ? 0.5 : 0.25,
        textAlign: "left",
        width: isRow ? "100%" : "auto",
      }}
    >
      <Typography
        component="span"
        variant={isRow ? "body1" : "body2"}
        sx={{
          flex: 1,
          fontWeight: isFormalName ? 700 : isRow ? undefined : 600,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </Typography>
      {selected ? (
        <>
          <StarRoundedIcon
            fontSize="small"
            sx={{
              color: isRow ? "var(--user-theme-action-text)" : "inherit",
            }}
          />
          {isRow ? (
            <Chip
              component="span"
              label={merchantText.currentDisplayName}
              size="small"
              sx={{
                bgcolor: "var(--user-theme-field-card-selected-bg)",
                color: "var(--user-theme-action-text)",
                fontWeight: 700,
              }}
            />
          ) : null}
        </>
      ) : null}
    </ButtonBase>
  );
}

export function MerchantNameOptions({
  archiveAliasAction,
  merchant,
  pending = false,
  setPreferredAliasAction,
  variant = "chips",
}: {
  archiveAliasAction?: ServerAction;
  merchant: Merchant;
  pending?: boolean;
  setPreferredAliasAction?: ServerAction;
  variant?: "chips" | "rows";
}) {
  const confirm = useConfirmDialog();
  const archiveFormRef = useRef<HTMLFormElement | null>(null);
  const options: MerchantNameOption[] = [
    {
      id: "",
      isFormalName: true,
      label: merchant.name,
      selected: !merchant.aliases.some((alias) => alias.is_preferred),
    },
    ...merchant.aliases.map((alias) => ({
      id: alias.id,
      isFormalName: false,
      label: alias.alias,
      selected: alias.is_preferred,
    })),
  ];
  const isRow = variant === "rows";
  const switchDisabled = pending || !setPreferredAliasAction;

  async function confirmArchiveAlias(
    event: MouseEvent<HTMLButtonElement>,
    alias: string,
  ) {
    archiveFormRef.current = event.currentTarget.form;
    const ok = await confirm({
      description: merchantText.archiveAliasDescription(alias),
      title: merchantText.archiveAliasConfirmTitle,
      tone: "delete",
    });

    if (ok) {
      archiveFormRef.current?.requestSubmit();
    }
  }

  if (!isRow) {
    return (
      <Stack
        component="form"
        action={setPreferredAliasAction}
        direction="row"
        sx={{ flexWrap: "wrap", gap: 0.75 }}
      >
        <input name="merchantId" type="hidden" value={merchant.id} />
        {options.map((option) => (
          <MerchantNameOptionButton
            disabled={switchDisabled}
            isRow={false}
            key={option.id}
            option={option}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack sx={{ gap: 1 }}>
      {options.map((option) => (
        <Stack
          key={option.id}
          direction="row"
          sx={{
            alignItems: "center",
            border: 1,
            borderColor: option.selected
              ? "var(--user-theme-action-text)"
              : "divider",
            borderRadius: `${designTokens.radius.item}px`,
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <Stack
            component="form"
            action={setPreferredAliasAction}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <input name="merchantId" type="hidden" value={merchant.id} />
            <input name="aliasId" type="hidden" value={option.id} />
            <MerchantNameOptionButton
              disabled={switchDisabled}
              isRow
              option={option}
            />
          </Stack>
          {option.id && archiveAliasAction ? (
            <form action={archiveAliasAction}>
              <input name="aliasId" type="hidden" value={option.id} />
              <IconButton
                aria-label={merchantText.removeAliasLabel(option.label)}
                color="error"
                disabled={pending}
                onClick={(event) => void confirmArchiveAlias(event, option.label)}
                type="button"
              >
                <CloseRoundedIcon />
              </IconButton>
            </form>
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}
