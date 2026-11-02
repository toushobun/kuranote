"use client";
import { useState } from "react";
import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import { merchantText } from "config/merchantText";
import { MerchantDetailsFields } from "organisms/merchants/MerchantDetailsFields/MerchantDetailsFields";
import { MerchantTagsField } from "organisms/merchants/MerchantTagsField/MerchantTagsField";
import { useMerchantDetails } from "organisms/merchants/useMerchantDetails";
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type {
  Merchant,
  MerchantIconStateAction,
  MerchantTag,
} from "types/merchants";

type MerchantEditFormProps = {
  action: ServerAction;
  id?: string;
  onDirtyChange?: (dirty: boolean) => void;
  savedKey?: string;
  stayOnSave?: boolean;
  fetchIconAction: MerchantIconStateAction;
  ledgerId: string;
  merchant: Merchant;
  pending?: boolean;
  tags?: MerchantTag[];
};

export function MerchantEditForm({
  action,
  id,
  onDirtyChange,
  savedKey,
  stayOnSave = false,
  fetchIconAction,
  ledgerId,
  merchant,
  pending = false,
  tags = [],
}: MerchantEditFormProps) {
  const details = useMerchantDetails({
    previewIconUrl: merchant.icon_url ?? "",
    name: merchant.name,
    note: merchant.note ?? "",
    websiteUrl: merchant.website_url ?? "",
  });

  const [tagIds, setTagIds] = useState(() =>
    merchant.tags.map((tag) => tag.id).sort(),
  );
  useDirtySnapshot(
    JSON.stringify([details.snapshot, tagIds]),
    onDirtyChange ?? null,
    true,
    savedKey,
  );

  return (
    <Stack component="form" id={id} action={action} spacing={2.5}>
      {stayOnSave && <input name="presentation" type="hidden" value="dialog" />}
      <input name="merchantId" type="hidden" value={merchant.id} />
      <Stack
        component="fieldset"
        spacing={2.5}
        disabled={pending}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
      >
        <MerchantDetailsFields
          fetchIconAction={fetchIconAction}
          initialIconUrl={merchant.icon_url}
          ledgerId={ledgerId}
          merchantId={merchant.id}
          name={details.name}
          note={details.note}
          onPreviewIconChange={details.setPreviewIconUrl}
          onNameChange={details.setName}
          onNoteChange={details.setNote}
          onWebsiteUrlChange={details.setWebsiteUrl}
          websiteUrl={details.websiteUrl}
        />
        <MerchantTagsField
          onSelectionChange={setTagIds}
          initialTagIds={merchant.tags.map((tag) => tag.id)}
          tags={tags}
        />
        <Button
          disabled={pending}
          fullWidth
          sx={{ borderRadius: `${designTokens.radius.full}px` }}
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
    </Stack>
  );
}
