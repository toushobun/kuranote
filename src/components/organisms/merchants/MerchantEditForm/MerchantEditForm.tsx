"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import InputAdornment from "@mui/material/InputAdornment";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useDirtySnapshot } from "molecules/ui/UnsavedChangesDialog/useDirtySnapshot";

import { ActionButton } from "atoms/ui/ActionButton/ActionButton";
import { actionPendingMessages } from "config/actionPendingMessages";
import { merchantText } from "config/merchantText";
import {
  MerchantDisplayNameDrawer,
  type MerchantAliasDraft,
} from "organisms/merchants/MerchantDisplayNameDrawer/MerchantDisplayNameDrawer";
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
  const [aliases, setAliases] = useState<MerchantAliasDraft[]>(() =>
    merchant.aliases.map(({ id, alias }) => ({ id, alias })),
  );
  const [preferredAliasId, setPreferredAliasId] = useState<string | null>(
    () => merchant.aliases.find((alias) => alias.is_preferred)?.id ?? null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSessionId, setDrawerSessionId] = useState(0);
  const [tagIds, setTagIds] = useState(() =>
    merchant.tags.map((tag) => tag.id).sort(),
  );
  const activeAliasIds = new Set(aliases.map((alias) => alias.id));
  const addedAliases = aliases
    .filter((alias) => alias.id.startsWith("new:"))
    .map((alias) => alias.alias);
  const archivedAliasIds = merchant.aliases
    .filter((alias) => !activeAliasIds.has(alias.id))
    .map((alias) => alias.id);
  const preferredAlias =
    aliases.find((alias) => alias.id === preferredAliasId)?.alias ?? null;
  const displayName = preferredAlias ?? details.name;

  useDirtySnapshot(
    JSON.stringify([details.snapshot, tagIds, aliases, preferredAliasId]),
    onDirtyChange ?? null,
    true,
    savedKey,
  );

  return (
    <Stack component="form" id={id} action={action} spacing={2.5}>
      <input name="merchantId" type="hidden" value={merchant.id} />
      <input
        name="addedAliases"
        type="hidden"
        value={JSON.stringify(addedAliases)}
      />
      <input
        name="archivedAliasIds"
        type="hidden"
        value={JSON.stringify(archivedAliasIds)}
      />
      <input name="preferredAlias" type="hidden" value={preferredAlias ?? ""} />
      <Stack
        component="fieldset"
        spacing={2.5}
        disabled={pending}
        sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
      >
        <MerchantDetailsFields
          fetchIconAction={fetchIconAction}
          previewIconUrl={details.previewIconUrl}
          ledgerId={ledgerId}
          merchantId={merchant.id}
          name={details.name}
          note={details.note}
          onPreviewIconChange={details.setPreviewIconUrl}
          onNameChange={details.setName}
          onNoteChange={details.setNote}
          onWebsiteUrlChange={details.setWebsiteUrl}
          websiteUrl={details.websiteUrl}
          displayNameField={
            <ButtonBase
              aria-label={merchantText.openDisplayName}
              component="div"
              disabled={pending}
              onClick={() => {
                setDrawerSessionId((current) => current + 1);
                setDrawerOpen(true);
              }}
              role="button"
              tabIndex={0}
              sx={{ display: "block", textAlign: "left", width: "100%" }}
            >
              <TextField
                fullWidth
                label={merchantText.preferredTitle}
                size="small"
                value={displayName}
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography color="textSecondary" variant="caption">
                          {merchantText.aliasCount(aliases.length)}
                        </Typography>
                        <ChevronRightRoundedIcon
                          sx={{ color: "text.secondary", ml: 0.5 }}
                        />
                      </InputAdornment>
                    ),
                  },
                  htmlInput: { tabIndex: -1, "aria-hidden": true },
                }}
                sx={{ pointerEvents: "none" }}
              />
            </ButtonBase>
          }
        />
        <MerchantTagsField
          onSelectionChange={setTagIds}
          initialTagIds={merchant.tags.map((tag) => tag.id)}
          tags={tags}
        />
        <ActionButton
          pending={pending}
          pendingLabel={actionPendingMessages.save}
          fullWidth
          sx={{ borderRadius: `${designTokens.radius.full}px` }}
          type="submit"
          variant="contained"
        >
          {merchantText.save}
        </ActionButton>
      </Stack>
      <MerchantDisplayNameDrawer
          aliases={aliases}
          merchantName={details.name}
          open={drawerOpen}
          sessionId={drawerSessionId}
          onClose={() => setDrawerOpen(false)}
          onConfirm={(nextAliases, nextPreferredAliasId) => {
            setAliases(nextAliases);
            setPreferredAliasId(nextPreferredAliasId);
            setDrawerOpen(false);
          }}
          preferredAliasId={preferredAliasId}
      />
    </Stack>
  );
}
