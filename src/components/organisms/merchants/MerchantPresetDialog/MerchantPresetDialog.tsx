"use client";

import { useBackLayer } from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useId } from "react";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";

import { merchantPresetMessages as messages } from "config/merchantPresetMessages";
import type { MerchantPresetOptions } from "internal/merchant";
import { MerchantPresetSelector } from "organisms/merchants/MerchantPresetSelector/MerchantPresetSelector";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type { MerchantPresetStateAction } from "types/merchants";
import { useMerchantPresetDialog } from "./useMerchantPresetDialog";

export type MerchantPresetDialogProps = {
  action: MerchantPresetStateAction;
  options: MerchantPresetOptions;
  onClose: () => void;
  onSaved?: () => void;
};

/** 内容随关闭卸载；重新打开时清空本次勾选与失败反馈。 */
export function MerchantPresetDialog({
  action,
  options,
  onClose,
  onSaved,
}: MerchantPresetDialogProps) {
  const formId = useId();
  const { runAction } = useBackLayer(true, requestClose);
  const guardedAction = useCallback<MerchantPresetStateAction>(
    (state, data) => runAction(() => action(state, data)),
    [action, runAction],
  );
  const dialog = useMerchantPresetDialog(options, guardedAction, !!onSaved);
  const pending = dialog.submission.pending;
  useEffect(() => {
    if (dialog.submission.state.success) onSaved?.();
  }, [dialog.submission.state.success, onSaved]);
  function requestClose() {
    if (!pending) onClose();
  }
  return (
    <>
      <WizardDialog
        title={messages.title}
        closeLabel={messages.close}
        disabled={pending}
        onClose={requestClose}
        open
      >
        <WizardStepLayout
          actions={
            <WizardActionBar
              previous={{
                label: messages.cancel,
                disabled: pending,
                onClick: requestClose,
              }}
              next={{
                label: messages.submit(dialog.selectedKeys.length),
                loading: pending,
                loadingLabel: messages.submitting,
                disabled: dialog.selectedKeys.length === 0,
                type: "submit",
                form: formId,
              }}
            />
          }
        >
          <Stack
            action={dialog.submit}
            component="form"
            id={formId}
            spacing={2}
          >
            {options.templateVersion === null ? (
              <Typography color="textSecondary" variant="body2">
                {messages.noTemplate}
              </Typography>
            ) : (
              <>
                <Typography color="textSecondary" variant="body2">
                  {messages.description}
                </Typography>
                <MerchantPresetSelector
                  {...options}
                  region={options.region}
                  additionalRegions={dialog.additionalRegions}
                  onAdditionalRegionsChange={dialog.setAdditionalRegions}
                  disabled={pending}
                  disabledKeys={options.addedKeys}
                  selectedKeys={dialog.selectedKeys}
                  onChange={dialog.setSelectedKeys}
                />
              </>
            )}
          </Stack>
        </WizardStepLayout>
      </WizardDialog>
      <ActionFailureFeedback
        state={dialog.submission.state}
        title={messages.failureTitle}
      />
    </>
  );
}
