"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { routePaths } from "config/paths";
import { MerchantDetailsFields } from "organisms/merchants/MerchantDetailsFields/MerchantDetailsFields";
import { MerchantTagsField } from "organisms/merchants/MerchantTagsField/MerchantTagsField";
import { useMerchantDetails } from "organisms/merchants/useMerchantDetails";
import type { ServerAction } from "types/actions";
import type { MerchantIconStateAction, MerchantTag } from "types/merchants";

type MerchantFormProps = {
  action: ServerAction;
  fetchIconAction: MerchantIconStateAction;
  ledgerId: string;
  pending?: boolean;
  tags?: MerchantTag[];
};

export function MerchantForm({
  action,
  fetchIconAction,
  ledgerId,
  pending = false,
  tags = [],
}: MerchantFormProps) {
  const details = useMerchantDetails();

  return (
    <Stack component="form" action={action} spacing={2.5}>
      <MerchantDetailsFields
        fetchIconAction={fetchIconAction}
        ledgerId={ledgerId}
        name={details.name}
        note={details.note}
        onNameChange={details.setName}
        onNoteChange={details.setNote}
        onWebsiteUrlChange={details.setWebsiteUrl}
        websiteUrl={details.websiteUrl}
      />
      <MerchantTagsField tags={tags} />
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
        <PrimaryActionButton
          disabled={pending}
          fullWidth
          sx={{ borderRadius: 999, fontWeight: 700, minHeight: 40 }}
          type="submit"
        >
          {pending ? (
            <CircularProgress aria-label="新增中" color="inherit" size={22} />
          ) : (
            "保存商家"
          )}
        </PrimaryActionButton>
      </Stack>
    </Stack>
  );
}
