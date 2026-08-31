"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { merchantText } from "config/merchantText";
import { MerchantDetailsFields } from "organisms/merchants/MerchantDetailsFields/MerchantDetailsFields";
import { useMerchantDetails } from "organisms/merchants/useMerchantDetails";
import type { ServerAction } from "types/actions";
import type { Merchant } from "types/merchants";

type MerchantEditFormProps = {
  action: ServerAction;
  ledgerId: string;
  merchant: Merchant;
  pending?: boolean;
};

export function MerchantEditForm({
  action,
  ledgerId,
  merchant,
  pending = false,
}: MerchantEditFormProps) {
  const details = useMerchantDetails({
    name: merchant.name,
    note: merchant.note ?? "",
    websiteUrl: merchant.website_url ?? "",
  });

  return (
    <Stack component="form" action={action} spacing={2.5}>
      <input name="merchantId" type="hidden" value={merchant.id} />
      <MerchantDetailsFields
        ledgerId={ledgerId}
        merchantId={merchant.id}
        name={details.name}
        note={details.note}
        onNameChange={details.setName}
        onNoteChange={details.setNote}
        onWebsiteUrlChange={details.setWebsiteUrl}
        websiteUrl={details.websiteUrl}
      />
      <Button
        disabled={pending}
        fullWidth
        sx={{ borderRadius: 999 }}
        type="submit"
        variant="contained"
      >
        {pending ? (
          <CircularProgress aria-label="保存中" color="inherit" size={22} />
        ) : (
          merchantText.save
        )}
      </Button>
    </Stack>
  );
}
