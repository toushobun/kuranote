"use client";

import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import Button from "@mui/material/Button";
import { useCallback, useRef, useState } from "react";

import { routePaths } from "config/paths";
import { merchantPageMessages, merchantText } from "config/merchantText";
import { DeleteConfirmationDialog } from "molecules/ui/OperationFeedbackDialogs";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantDisplayNameFeedback } from "organisms/merchants/MerchantDisplayNameFeedback/MerchantDisplayNameFeedback";
import { MerchantDisplayNameEditor } from "organisms/merchants/MerchantDisplayNameEditor/MerchantDisplayNameEditor";
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
  archiveMerchantAliasAction: MerchantStateAction;
  createMerchantAliasAction: MerchantStateAction;
  fetchIconAction: MerchantIconStateAction;
  ledgerId: string;
  ledgerName: string;
  merchant: Merchant;
  tags: MerchantTag[];
  setPreferredMerchantAliasAction: MerchantStateAction;
  updateMerchantAction: MerchantStateAction;
};

type AliasFeedbackOperation = "archiveAlias" | "createAlias" | "setPreferred";

export function MerchantEditTemplate({
  archiveMerchantAction,
  archiveMerchantAliasAction,
  createMerchantAliasAction,
  fetchIconAction,
  ledgerId,
  ledgerName,
  merchant,
  tags,
  setPreferredMerchantAliasAction,
  updateMerchantAction,
}: MerchantEditTemplateProps) {
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [aliasDirty, setAliasDirty] = useState(false);
  const guard = useUnsavedChangesGuard({
    isDirty: detailsDirty || aliasDirty,
    saveFormId:
      detailsDirty && aliasDirty
        ? null
        : aliasDirty
          ? "merchant-alias-form"
          : "merchant-edit-form",
  });
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [aliasFeedbackOperation, setAliasFeedbackOperation] =
    useState<AliasFeedbackOperation | null>(null);
  const archiveFormRef = useRef<HTMLFormElement>(null);
  const update = useMerchantsActionState(updateMerchantAction, {
    merchantId: merchant.id,
    operation: "update",
    runAction: aliasDirty ? guard.runInPlaceAction : guard.runAction,
  });
  const archive = useMerchantsActionState(archiveMerchantAction, {
    merchantId: merchant.id,
    operation: "archive",
    runAction: guard.runAction,
  });
  const createAlias = useMerchantsActionState(createMerchantAliasAction, {
    merchantId: merchant.id,
    operation: "createAlias",
    runAction: guard.runInPlaceAction,
  });
  const archiveAlias = useMerchantsActionState(archiveMerchantAliasAction, {
    merchantId: merchant.id,
    operation: "archiveAlias",
    runAction: guard.runInPlaceAction,
  });
  const setPreferred = useMerchantsActionState(
    setPreferredMerchantAliasAction,
    {
      merchantId: merchant.id,
      operation: "setPreferred",
      runAction: guard.runInPlaceAction,
    },
  );
  const aliasPending =
    createAlias.pending || archiveAlias.pending || setPreferred.pending;
  const createAliasDispatch = createAlias.action;
  const archiveAliasDispatch = archiveAlias.action;
  const setPreferredDispatch = setPreferred.action;
  const createAliasAction = useCallback(
    (formData: FormData) => {
      setAliasFeedbackOperation("createAlias");
      createAliasDispatch(formData);
    },
    [createAliasDispatch],
  );
  const archiveAliasAction = useCallback(
    (formData: FormData) => {
      setAliasFeedbackOperation("archiveAlias");
      archiveAliasDispatch(formData);
    },
    [archiveAliasDispatch],
  );
  const setPreferredAliasAction = useCallback(
    (formData: FormData) => {
      setAliasFeedbackOperation("setPreferred");
      setPreferredDispatch(formData);
    },
    [setPreferredDispatch],
  );
  const aliasFeedback =
    aliasFeedbackOperation === "createAlias"
      ? {
          errorTitle: merchantText.createAliasErrorTitle,
          state: createAlias.state,
        }
      : aliasFeedbackOperation === "archiveAlias"
        ? {
            errorTitle: merchantText.archiveAliasErrorTitle,
            state: archiveAlias.state,
          }
        : aliasFeedbackOperation === "setPreferred"
          ? {
              errorTitle: merchantText.preferredErrorTitle,
              state: setPreferred.state,
            }
          : null;

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
          onDirtyChange={setDetailsDirty}
          savedKey={update.state.successKey}
          stayOnSave={aliasDirty}
          fetchIconAction={fetchIconAction}
          ledgerId={ledgerId}
          merchant={merchant}
          pending={update.pending || aliasPending}
          tags={tags}
        />
      </SectionCard>

      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <MerchantDisplayNameEditor
          archiveAliasAction={archiveAliasAction}
          createAliasAction={createAliasAction}
          formId="merchant-alias-form"
          onDirtyChange={setAliasDirty}
          savedKey={createAlias.state.successKey}
          merchant={merchant}
          pending={aliasPending || update.pending}
          setPreferredAliasAction={setPreferredAliasAction}
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
      {aliasFeedback ? (
        <MerchantDisplayNameFeedback
          errorTitle={aliasFeedback.errorTitle}
          state={aliasFeedback.state}
        />
      ) : null}
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
