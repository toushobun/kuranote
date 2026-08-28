"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { merchantText } from "config/merchantText";
import { MerchantDetailsFields } from "organisms/merchants/MerchantDetailsFields/MerchantDetailsFields";
import { useMerchantDetails } from "organisms/merchants/useMerchantDetails";
import type { ServerAction } from "types/actions";

type MerchantFormProps = {
  action: ServerAction;
  ledgerId: string;
  pending?: boolean;
};

export function MerchantForm({
  action,
  ledgerId,
  pending = false,
}: MerchantFormProps) {
  const details = useMerchantDetails();

  return (
    <Stack component="form" action={action} spacing={3}>
      <MerchantDetailsFields
        ledgerId={ledgerId}
        name={details.name}
        note={details.note}
        onNameChange={details.setName}
        onNoteChange={details.setNote}
        onWebsiteUrlChange={details.setWebsiteUrl}
        websiteUrl={details.websiteUrl}
      />
      <Button disabled={pending} type="submit" variant="contained">
        {pending ? (
          <CircularProgress aria-label="新增中" color="inherit" size={22} />
        ) : (
          merchantText.create
        )}
      </Button>
    </Stack>
  );
}
