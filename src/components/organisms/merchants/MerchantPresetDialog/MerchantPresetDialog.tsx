"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Link from "next/link";
import { useId } from "react";

import { merchantPresetMessages as messages } from "config/merchantPresetMessages";
import { routePaths } from "config/paths";
import type { MerchantPresetOptions } from "internal/merchant";
import { EmptyState } from "molecules/ui/EmptyState";
import { GroupedPresetChecklist } from "molecules/ui/GroupedPresetChecklist/GroupedPresetChecklist";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { LedgerSetupStepLayout } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupStepLayout";
import { getLedgerSetupWizardPaperSx } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
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
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const titleId = useId();
  const formId = useId();
  const dialog = useMerchantPresetDialog(options, action);
  const pending = dialog.submission.pending;
  function requestClose() {
    if (!pending) onClose();
  }
  return (
    <>
      <Dialog
        aria-labelledby={titleId}
        fullScreen={fullScreen}
        fullWidth
        maxWidth={false}
        onClose={requestClose}
        open
        slotProps={{ paper: { sx: getLedgerSetupWizardPaperSx(fullScreen) } }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 40px",
            alignItems: "center",
            p: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <IconButton
            aria-label={messages.close}
            disabled={pending}
            onClick={requestClose}
          >
            <CloseRoundedIcon />
          </IconButton>
          <Typography
            component="h2"
            id={titleId}
            variant="subtitle1"
            sx={{ fontWeight: 900, textAlign: "center" }}
          >
            {messages.title}
          </Typography>
        </Box>
        <LedgerSetupStepLayout
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
                  sx={{
                    alignSelf: "flex-end",
                    color: "var(--user-theme-action-text)",
                    fontWeight: 800,
                    minHeight: 40,
                  }}
                >
                  {dialog.selection.allSelected
                    ? messages.selectNone
                    : messages.selectAll}
                </Button>
                <GroupedPresetChecklist
                  disabled={pending}
                  lockExpansion={pending}
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
        </LedgerSetupStepLayout>
      </Dialog>
      <ActionFailureFeedback
        state={dialog.submission.state}
        title={messages.failureTitle}
      />
    </>
  );
}
