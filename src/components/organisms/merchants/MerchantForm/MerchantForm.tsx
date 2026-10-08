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
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type { MerchantIconStateAction, MerchantTag } from "types/merchants";

type MerchantFormProps = {
  action: ServerAction;
  fetchIconAction: MerchantIconStateAction;
  ledgerId: string;
  pending?: boolean;
  // 新增成功后返回的站内路径（例如记一笔），由服务端再次校验。
  returnTo?: string | null;
  tags?: MerchantTag[];
};

export function MerchantForm({
  action,
  fetchIconAction,
  ledgerId,
  pending = false,
  returnTo = null,
  tags = [],
}: MerchantFormProps) {
  const details = useMerchantDetails();

  return (
    <Stack component="form" action={action} spacing={2.5}>
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
      <MerchantTagsField tags={tags} />
      <Stack direction="row" spacing={1.5}>
        <Button
          component={Link}
          fullWidth
          href={routePaths.merchants}
          sx={{ borderRadius: `${designTokens.radius.full}px` }}
          variant="outlined"
        >
          取消
        </Button>
        <PrimaryActionButton
          disabled={pending}
          fullWidth
          sx={{
            borderRadius: `${designTokens.radius.full}px`,
            fontWeight: 700,
            minHeight: 40,
          }}
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
