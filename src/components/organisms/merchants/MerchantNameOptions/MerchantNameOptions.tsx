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
      label: merchant.name,
      selected: !merchant.aliases.some((alias) => alias.is_preferred),
    },
    ...merchant.aliases.map((alias) => ({
      id: alias.id,
      label: alias.alias,
      selected: alias.is_preferred,
    })),
  ];
  const isRow = variant === "rows";

  return (
    <Stack
      direction={isRow ? "column" : "row"}
      sx={{ flexWrap: "wrap", gap: isRow ? 1 : 0.75 }}
    >
      {options.map(({ id, label, selected }) => (
        <Stack
          key={id}
          direction="row"
          sx={{ alignItems: "center", gap: 1, minWidth: 0, maxWidth: "100%" }}
        >
          <Stack
            component="form"
            action={setPreferredAliasAction}
            sx={{ flex: 1, minWidth: 0 }}
          >
            <input name="merchantId" type="hidden" value={merchant.id} />
            <input name="aliasId" type="hidden" value={id} />
            <ButtonBase
              aria-label={merchantText.displayNameOptionLabel(label, selected)}
              aria-pressed={selected}
              disabled={pending || !setPreferredAliasAction}
              type="submit"
              sx={{
                border: 1,
                borderColor: selected ? "primary.main" : "divider",
                borderRadius: `${isRow ? designTokens.radius.item : designTokens.radius.sm}px`,
                bgcolor: selected ? "primary.main" : "transparent",
                color: selected ? "primary.contrastText" : "text.primary",
                display: "flex",
                gap: 0.75,
                justifyContent: "flex-start",
                minHeight: (theme) => theme.spacing(isRow ? 5 : 4),
                px: 1.25,
                py: 0.5,
                textAlign: "left",
                "&:hover": {
                  bgcolor: selected ? "primary.main" : "action.hover",
                },
                "&:active": {
                  bgcolor: selected ? "primary.dark" : "action.selected",
                },
                "&.Mui-focusVisible": {
                  outline: "auto",
                  outlineOffset: (theme) => theme.spacing(0.25),
                },
              }}
            >
              {!id ? (
                <Chip
                  component="span"
                  label={merchantText.formalName}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: "inherit",
                    borderColor: "currentColor",
                    borderRadius: `${designTokens.radius.sm}px`,
                  }}
                />
              ) : null}
              <Typography
                component="span"
                variant="body2"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  fontWeight: 600,
                }}
              >
                {label}
              </Typography>
              {selected ? (
                <>
                  <StarRoundedIcon fontSize="small" />
                  {isRow ? (
                    <Chip
                      component="span"
                      label={merchantText.currentDisplayName}
                      size="small"
                      sx={{ color: "inherit", bgcolor: "transparent" }}
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
