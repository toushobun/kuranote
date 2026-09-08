"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { merchantText } from "config/merchantText";
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type { Merchant } from "types/merchants";

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
  const options = [
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
  const optionRadius = isRow
    ? designTokens.radius.item
    : designTokens.radius.sm;

  return (
    <Stack
      direction={isRow ? "column" : "row"}
      sx={{ flexWrap: "wrap", gap: isRow ? 1 : 0.75 }}
    >
      {options.map(({ id, isFormalName, label, selected }) => (
        <Stack
          key={id}
          direction="row"
          sx={{
            alignItems: "center",
            border: isRow ? 1 : 0,
            borderColor: isRow
              ? selected
                ? "var(--user-theme-action-text)"
                : "divider"
              : "transparent",
            borderRadius: isRow
              ? `${designTokens.radius.item}px`
              : undefined,
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <Stack
            component="form"
            action={setPreferredAliasAction}
            sx={{ flex: isRow ? 1 : "0 1 auto", minWidth: 0 }}
          >
            <input name="merchantId" type="hidden" value={merchant.id} />
            <input name="aliasId" type="hidden" value={id} />
            <ButtonBase
              aria-label={merchantText.displayNameOptionLabel(label, selected)}
              aria-pressed={selected}
              disabled={pending || !setPreferredAliasAction}
              type="submit"
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
              {isFormalName ? (
                <Chip
                  color={isRow ? "primary" : undefined}
                  component="span"
                  label={merchantText.formalName}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: isRow ? undefined : "currentColor",
                    borderRadius: `${designTokens.radius.sm}px`,
                    color: isRow ? undefined : "inherit",
                  }}
                />
              ) : null}
              <Typography
                component="span"
                variant={isRow ? "body1" : "body2"}
                sx={{
                  flex: 1,
                  fontWeight: isRow ? undefined : 600,
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
                      color: isRow
                        ? "var(--user-theme-action-text)"
                        : "inherit",
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
          </Stack>
          {id && archiveAliasAction ? (
            <form action={archiveAliasAction}>
              <input name="aliasId" type="hidden" value={id} />
              <IconButton
                aria-label={merchantText.removeAliasLabel(label)}
                color="error"
                disabled={pending}
                type="submit"
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
