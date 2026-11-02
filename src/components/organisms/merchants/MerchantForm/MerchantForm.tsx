"use client";

import { useState } from "react";
import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";
import Stack from "@mui/material/Stack";

import { merchantText } from "config/merchantText";
import { routePaths } from "config/paths";
import { PageFormActions } from "molecules/ui/PageFormActions/PageFormActions";
import { MerchantDetailsFields } from "organisms/merchants/MerchantDetailsFields/MerchantDetailsFields";
import { MerchantTagsField } from "organisms/merchants/MerchantTagsField/MerchantTagsField";
import { useMerchantDetails } from "organisms/merchants/useMerchantDetails";
import type { ServerAction } from "types/actions";
import type { MerchantIconStateAction, MerchantTag } from "types/merchants";

type MerchantFormProps = {
  action: ServerAction;
  fetchIconAction: MerchantIconStateAction;
  initialName?: string;
  ledgerId: string;
  onCancel?: () => void;
  id?: string;
  onDirtyChange?: (dirty: boolean) => void;
  pending?: boolean;
  // 新增成功或取消后返回的站内路径（例如记一笔），由服务端再次校验。
  returnTo?: string | null;
  tags?: MerchantTag[];
};

export function MerchantForm({
  action,
  fetchIconAction,
  initialName,
  ledgerId,
  onCancel,
  id,
  onDirtyChange,
  pending = false,
  returnTo = null,
  tags = [],
}: MerchantFormProps) {
  const details = useMerchantDetails({ name: initialName });

  const [tagIds, setTagIds] = useState<string[]>([]);
  useDirtySnapshot(
    JSON.stringify([details.name, details.note, details.websiteUrl, tagIds]),
    onDirtyChange ?? null,
    true,
  );
  return (
    <Stack component="form" id={id} action={action} spacing={2.5}>
      {returnTo ? (
        <input name="returnTo" readOnly type="hidden" value={returnTo} />
      ) : null}
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
      <MerchantTagsField tags={tags} onSelectionChange={setTagIds} />
      <PageFormActions
        {...(onCancel
          ? { onCancel }
          : { cancelHref: returnTo ?? routePaths.merchants })}
        cancelLabel={merchantText.cancel}
        pending={pending}
        pendingLabel={merchantText.creating}
        submitLabel={merchantText.saveMerchant}
      />
    </Stack>
  );
}
