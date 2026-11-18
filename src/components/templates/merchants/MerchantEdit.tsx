"use client";

import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import Button from "@mui/material/Button";
import { useRef, useState } from "react";

import { routePaths } from "config/paths";
import { merchantPageMessages, merchantText } from "config/merchantText";
import { DeleteConfirmationDialog } from "molecules/ui/OperationFeedbackDialogs";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantDisplayNameFeedback } from "organisms/merchants/MerchantDisplayNameFeedback/MerchantDisplayNameFeedback";
import { MerchantEditForm } from "organisms/merchants/MerchantEditForm/MerchantEditForm";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { designTokens } from "theme/theme";
import type {
  Merchant,
  MerchantIconStateAction,
  MerchantStateAction,
  MerchantTag,
} from "types/merchants";

import { useMerchantsActionState } from "./useMerchantsActionState";

type MerchantEditTemplateProps = {
  archiveMerchantAction: MerchantStateAction;
  fetchIconAction: MerchantIconStateAction;
  ledgerId: string;
  ledgerName: string;
  merchant: Merchant;
  tags: MerchantTag[];
  updateMerchantAction: MerchantStateAction;
};

export function MerchantEditTemplate({
  archiveMerchantAction,
  fetchIconAction,
  ledgerId,
  ledgerName,
  merchant,
  tags,
  updateMerchantAction,
}: MerchantEditTemplateProps) {
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChangesGuard({
    isDirty: dirty,
    saveFormId: "merchant-edit-form",
  });
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const archiveFormRef = useRef<HTMLFormElement>(null);
  const update = useMerchantsActionState(
    (state, data) =>
      guard.runSaveAction(data, (values) =>
        updateMerchantAction(state, values),
      ),
    { merchantId: merchant.id, operation: "update" },
  );
  const archive = useMerchantsActionState(archiveMerchantAction, {
    merchantId: merchant.id,
    operation: "archive",
    runAction: guard.runAction,
  });

  return (
    <SettingsPageLayout
      action={
        <form action={archive.action} ref={archiveFormRef}>
          <input name="merchantId" type="hidden" value={merchant.id} />
          <Button
            color="error"
            disabled={archive.pending}
            onClick={() => setIsArchiveConfirmOpen(true)}
            size="small"
            sx={{ borderRadius: `${designTokens.radius.full}px` }}
            type="button"
            variant="outlined"
          >
            {merchantText.archive}
          </Button>
        </form>
      }
      back={{
        href: routePaths.merchants,
        label: merchantPageMessages.backToMerchants,
      }}
      subtitle={merchantPageMessages.editSubtitle(ledgerName)}
      title={merchantText.edit}
    >
      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <MerchantEditForm
          action={update.action}
          id="merchant-edit-form"
          onDirtyChange={setDirty}
          savedKey={update.state.successKey}
          fetchIconAction={fetchIconAction}
          ledgerId={ledgerId}
          merchant={merchant}
          pending={update.pending}
          tags={tags}
        />
      </SectionCard>

      <MerchantDisplayNameFeedback
        state={update.state}
        errorTitle={merchantText.editErrorTitle}
      />
      <MerchantFailureFeedback
        state={archive.state}
        title={merchantText.archiveErrorTitle}
      />
      {isArchiveConfirmOpen ? (
        <DeleteConfirmationDialog
          confirmLabel={merchantText.archive}
          description={merchantText.archiveDescription}
          onCancel={() => setIsArchiveConfirmOpen(false)}
          onConfirm={() => {
            setIsArchiveConfirmOpen(false);
            archiveFormRef.current?.requestSubmit();
          }}
          open={isArchiveConfirmOpen}
          title={merchantText.archiveConfirmTitle}
        />
      ) : null}
      <UnsavedChangesDialog {...guard.dialogProps} />
    </SettingsPageLayout>
  );
}
