"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { ledgerSetupEntryMessages } from "config/ledgerSetupMessages";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger";
import { ErrorState } from "molecules/ui/ErrorState";
import { LoadingState } from "molecules/ui/LoadingState";
import {
  getLedgerSetupWizardPaperSx,
  LedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";

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
 * 已有创建中账本时向导恢复到上次的步骤，并在顶部提示条说明。
 */
export function LedgerSetupWizardLauncher({
  launcher,
}: LedgerSetupWizardLauncherProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { cancel, closeWizard, openWizard, state, wizardActions } = launcher;

  return (
    <>
      {state.status === "ready" ? (
        <LedgerSetupWizard
          actions={wizardActions}
          defaultRootCategoryNames={state.view.defaultRootCategoryNames}
          defaults={state.view.defaults}
          initialNotice={state.view.progress ? inProgressNotice : null}
          onClose={closeWizard}
          open
          progress={state.view.progress}
        />
      ) : null}

      <Dialog
        fullScreen={fullScreen}
        fullWidth
        maxWidth={false}
        onClose={cancel}
        open={state.status === "loading" || state.status === "error"}
        slotProps={{
          paper: {
            "aria-label":
              state.status === "error"
                ? messages.loadErrorTitle
                : messages.loading,
            sx: getLedgerSetupWizardPaperSx(fullScreen),
          },
        }}
      >
        <Box sx={headerSx}>
          <IconButton aria-label={messages.close} onClick={cancel}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Box sx={bodySx}>
          {state.status === "error" ? (
            <ErrorState
              action={
                <Button onClick={openWizard} variant="outlined">
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
      </Dialog>
    </>
  );
}

const headerSx = {
  display: "flex",
  flexShrink: 0,
  pt: "calc(8px + env(safe-area-inset-top))",
  px: { xs: 1, sm: 2 },
};

const bodySx = {
  px: { xs: 2, sm: 3 },
  py: 2,
};
