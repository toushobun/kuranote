"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { merchantText } from "config/merchantText";
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type { Merchant } from "types/merchants";

import { MerchantNameOptions } from "../MerchantNameOptions/MerchantNameOptions";

type MerchantDisplayNameEditorProps = {
  archiveAliasAction: ServerAction;
  createAliasAction: ServerAction;
  merchant: Merchant;
  pending?: boolean;
  setPreferredAliasAction: ServerAction;
};

export function MerchantDisplayNameEditor({
  archiveAliasAction,
  createAliasAction,
  merchant,
  pending = false,
  setPreferredAliasAction,
}: MerchantDisplayNameEditorProps) {
  const [alias, setAlias] = useState("");
  return (
    <Stack spacing={1}>
      <Stack spacing={0.5}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 900 }}>
          {merchantText.preferredTitle}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {merchantText.preferredHelper}
        </Typography>
      </Stack>

      <MerchantNameOptions
        merchant={merchant}
        pending={pending}
        setPreferredAliasAction={setPreferredAliasAction}
        archiveAliasAction={archiveAliasAction}
        variant="rows"
      />

      <Stack
        component="form"
        action={createAliasAction}
        direction="row"
        spacing={1}
      >
        <TextField
          autoComplete="off"
          fullWidth
          label={merchantText.aliasLabel}
          name="alias"
          onChange={(event) => setAlias(event.target.value)}
          placeholder="例如：来福、LIFE"
          required
          size="small"
          slotProps={{ htmlInput: { maxLength: 100 } }}
          sx={{
            "& .MuiInputBase-input.MuiOutlinedInput-input": {
              pl: 1.375,
            },
            "& .MuiOutlinedInput-root": {
              borderRadius: `${designTokens.radius.item}px`,
            },
          }}
          value={alias}
        />
        <Button
          disabled={pending}
          startIcon={<AddRoundedIcon />}
          sx={{
            borderRadius: `${designTokens.radius.item}px`,
            borderStyle: "dashed",
            flexShrink: 0,
          }}
          type="submit"
          variant="outlined"
        >
          {merchantText.addAlias}
        </Button>
        <input name="merchantId" type="hidden" value={merchant.id} />
      </Stack>
      <Typography color="text.secondary" variant="caption" sx={{ px: 0.5 }}>
        {merchantText.aliasHelper}
      </Typography>
    </Stack>
  );
}
