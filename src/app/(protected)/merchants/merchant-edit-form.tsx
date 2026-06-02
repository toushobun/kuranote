import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { updateMerchant } from "./actions";
import type { MerchantRow } from "./types";

type MerchantEditFormProps = {
  merchant: MerchantRow;
};

export function MerchantEditForm({ merchant }: MerchantEditFormProps) {
  return (
    <Stack component="form" action={updateMerchant} spacing={2} sx={{ mt: 3 }}>
      <input name="merchantId" type="hidden" value={merchant.id} />

      <TextField
        defaultValue={merchant.name}
        fullWidth
        label="商家名称"
        name="name"
        required
      />

      <TextField
        defaultValue={merchant.website_url ?? ""}
        fullWidth
        helperText="本期仅保存和展示网址，不自动读取 logo。"
        label="商家网址"
        name="websiteUrl"
        placeholder="https://example.com"
        type="url"
      />

      <TextField
        defaultValue={merchant.note ?? ""}
        fullWidth
        label="备注"
        minRows={3}
        multiline
        name="note"
      />

      <Button type="submit" variant="outlined">
        保存修改
      </Button>
    </Stack>
  );
}
