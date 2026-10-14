"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { ledgerSetupEntryMessages } from "config/ledgerSetupMessages";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger";
import { ErrorState } from "molecules/ui/ErrorState";
import { WizardDialog } from "molecules/ui/WizardDialog/WizardDialog";
import { LoadingState } from "molecules/ui/LoadingState";
import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";

import type { useLedgerSetupWizardLauncher } from "./useLedgerSetupWizardLauncher";

const messages = ledgerSetupEntryMessages;
const inProgressNotice =
  ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists];

type LedgerSetupWizardLauncherProps = {
  launcher: ReturnType<typeof useLedgerSetupWizardLauncher>;
};

/**
 * 首页与账本管理页共用的「打开创建账本向导」弹框：读取中、读取失败与向导本身。
 * 入口按钮调用 useLedgerSetupWizardLauncher 的 openWizard。
 * 已有创建中账本时向导恢复到上次的步骤；从「新增账本」等创建入口打开时在顶部提示条说明。
 */
export function LedgerSetupWizardLauncher({
  launcher,
}: LedgerSetupWizardLauncherProps) {
  const { cancel, closeWizard, retry, state, wizardActions } = launcher;

  return (
    <>
      {state.status === "ready" ? (
        <LedgerSetupWizard
          actions={wizardActions}
          defaultRootCategoryNames={state.view.defaultRootCategoryNames}
          defaults={state.view.defaults}
          initialNotice={
            state.intent === "create" && state.view.progress
              ? inProgressNotice
              : null
          }
          onClose={closeWizard}
          open
          progress={state.view.progress}
        />
      ) : null}

      <WizardDialog
        closeLabel={messages.close}
        closeAlignment="start"
        ariaLabel={
          state.status === "error" ? messages.loadErrorTitle : messages.loading
        }
        onClose={cancel}
        open={state.status === "loading" || state.status === "error"}
      >
        <Box sx={bodySx}>
          {state.status === "error" ? (
            <ErrorState
              action={
                <Button onClick={retry} variant="outlined">
                  {messages.retry}
                </Button>
              }
              description={state.message}
              title={messages.loadErrorTitle}
            />
          ) : (
            <LoadingState description={null} title={messages.loading} />
          )}
        </Box>
      </WizardDialog>
    </>
  );
}

const bodySx = {
  px: { xs: 2, sm: 3 },
  py: 2,
};
