"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import { routePaths } from "config/paths";
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
    <Stack component="form" action={action} spacing={2.5}>
      <MerchantDetailsFields
        ledgerId={ledgerId}
        name={details.name}
        note={details.note}
        onNameChange={details.setName}
        onNoteChange={details.setNote}
        onWebsiteUrlChange={details.setWebsiteUrl}
        websiteUrl={details.websiteUrl}
      />
      <Stack direction="row" spacing={1.5}>
        <Button
          component={Link}
          fullWidth
          href={routePaths.merchants}
          sx={{ borderRadius: 999 }}
          variant="outlined"
        >
          取消
        </Button>
        <Button
          disabled={pending}
          fullWidth
          sx={{ borderRadius: 999 }}
          type="submit"
          variant="contained"
        >
          {pending ? (
            <CircularProgress aria-label="新增中" color="inherit" size={22} />
          ) : (
            "保存商家"
          )}
        </Button>
      </Stack>
    </Stack>
  );
}
