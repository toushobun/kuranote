"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import type { ServerAction } from "types/actions";
import type { MerchantRow } from "types/merchants";

type MerchantEditFormProps = {
  action: ServerAction;
  merchant: MerchantRow;
};

export function MerchantEditForm({ action, merchant }: MerchantEditFormProps) {
  const [name, setName] = useState(merchant.name);
  const [note, setNote] = useState(merchant.note ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(merchant.website_url ?? "");

  return (
    <Stack component="form" action={action} spacing={2} sx={{ mt: 3 }}>
      <input name="merchantId" type="hidden" value={merchant.id} />

      <TextField
        fullWidth
        slotProps={{ htmlInput: { maxLength: 100 } }}
        label="商家名称"
        name="name"
        onChange={(event) => setName(event.target.value)}
        required
        value={name}
      />

      <TextField
        fullWidth
        helperText="本期仅保存和展示网址，不自动读取 logo。"
        label="商家网址"
        name="websiteUrl"
        onChange={(event) => setWebsiteUrl(event.target.value)}
        placeholder="https://example.com"
        type="url"
        value={websiteUrl}
      />

      <TextField
        fullWidth
        slotProps={{ htmlInput: { maxLength: 1000 } }}
        label="备注"
        minRows={3}
        multiline
        name="note"
        onChange={(event) => setNote(event.target.value)}
        value={note}
      />

      <Button type="submit" variant="outlined">
        保存修改
      </Button>
    </Stack>
  );
}
