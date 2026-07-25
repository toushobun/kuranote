"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import type { ServerAction } from "types/actions";

type MerchantAliasFormProps = {
  action: ServerAction;
  merchantId: string;
  pending?: boolean;
};

export function MerchantAliasForm({
  action,
  merchantId,
  pending = false,
}: MerchantAliasFormProps) {
  const [alias, setAlias] = useState("");

  return (
    <Stack component="form" action={action} spacing={1.5} sx={{ mt: 2 }}>
      <input name="merchantId" type="hidden" value={merchantId} />

      <TextField
        autoComplete="off"
        fullWidth
        slotProps={{ htmlInput: { maxLength: 100 } }}
        label="新增别名"
        name="alias"
        onChange={(event) => setAlias(event.target.value)}
        placeholder="例如：来福、LIFE、スギ"
        required
        size="small"
        value={alias}
      />

      <Button disabled={pending} size="small" type="submit" variant="outlined">
        新增别名
      </Button>
    </Stack>
  );
}
