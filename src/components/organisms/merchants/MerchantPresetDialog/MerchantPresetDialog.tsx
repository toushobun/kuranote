"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useId } from "react";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { presetChecklistToggleAllButtonSx } from "molecules/ui/GroupedPresetChecklist/presetChecklistStyles";

import { merchantPresetMessages as messages } from "config/merchantPresetMessages";
import { routePaths } from "config/paths";
import type { MerchantPresetOptions } from "internal/merchant";
import { EmptyState } from "molecules/ui/EmptyState";
import { GroupedPresetChecklist } from "molecules/ui/GroupedPresetChecklist/GroupedPresetChecklist";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { WizardStepLayout } from "molecules/ui/WizardDialog/WizardStepLayout";
import type { MerchantPresetStateAction } from "types/merchants";
import { useMerchantPresetDialog } from "./useMerchantPresetDialog";

export type MerchantPresetDialogProps = {
  action: MerchantPresetStateAction;
  options: MerchantPresetOptions;
  onClose: () => void;
};

/** 内容随关闭卸载；重新打开时清空本次勾选与失败反馈。 */
export function MerchantPresetDialog({
  action,
  options,
  onClose,
}: MerchantPresetDialogProps) {
  const formId = useId();
  const dialog = useMerchantPresetDialog(options, action);
  const pending = dialog.submission.pending;
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
                label: messages.submit(dialog.selection.keys.length),
                loading: pending,
                loadingLabel: messages.submitting,
                disabled: dialog.selection.keys.length === 0,
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
            <Typography color="textSecondary" variant="body2">
              {messages.description(options.currency)}
            </Typography>
            {dialog.checklist ? (
              <>
                <Button
                  disabled={
                    pending || dialog.selection.availableKeys.length === 0
                  }
                  onClick={dialog.toggleAll}
                  size="small"
                  sx={presetChecklistToggleAllButtonSx}
                >
                  {dialog.selection.allSelected
                    ? messages.selectNone
                    : messages.selectAll}
                </Button>
                <GroupedPresetChecklist
                  disabled={pending}
                  disabledKeys={options.addedKeys}
                  groups={dialog.checklist.groups}
                  items={dialog.checklist.items}
                  messages={messages.checklist}
                  onChange={dialog.setSelectedKeys}
                  selectedKeys={dialog.selectedKeys}
                />
              </>
            ) : (
              <EmptyState
                title={messages.noTemplate.title}
                description={messages.noTemplate.description}
                action={
                  <Button
                    component={Link}
                    href={routePaths.merchantsNew}
                    variant="contained"
                  >
                    {messages.manual}
                  </Button>
                }
              />
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
