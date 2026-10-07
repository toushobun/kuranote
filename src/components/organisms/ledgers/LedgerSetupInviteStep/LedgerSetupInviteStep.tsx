"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerSetupInviteMessages } from "config/ledgerSetupMessages";
import { placeholderMemberText } from "config/placeholderMemberText";
import { ErrorState } from "molecules/ui/ErrorState";
import { LoadingState } from "molecules/ui/LoadingState";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { LedgerInviteEntry } from "organisms/ledgers/LedgerInviteEntry/LedgerInviteEntry";
import { LedgerInvitePendingProvider } from "organisms/ledgers/LedgerInvitePendingContext/LedgerInvitePendingContext";
import { LedgerSetupStepLayout } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";
import type { LedgerSetupProgress } from "types/ledgers";

import { useLedgerSetupInviteStep } from "./useLedgerSetupInviteStep";

const messages = ledgerSetupInviteMessages;

/**
 * 向导第 6 步「邀请成员」：账本已完成并切换为当前账本。
 * 邀请 UI 直接复用账本设置页的 LedgerInviteEntry；进度中的草稿已过期，只使用新账本 ID 与名称。
 * 账本已完成，不能返回上一步，只提供「完成」进入完成页。
 */
export function LedgerSetupInviteStep({
  actions,
  onFinish,
  progress,
}: LedgerSetupWizardStepProps) {
  if (!progress) return null;

  return (
    <LedgerSetupInviteStepContent
      actions={actions}
      onFinish={onFinish}
      progress={progress}
    />
  );
}

function LedgerSetupInviteStepContent({
  actions,
  onFinish,
  progress,
}: Pick<LedgerSetupWizardStepProps, "actions" | "onFinish"> & {
  progress: LedgerSetupProgress;
}) {
  const { id: ledgerId, name: ledgerName } = progress.setup;
  const step = useLedgerSetupInviteStep({ actions, ledgerId });

  return (
    <LedgerSetupStepLayout
      actions={
        <WizardActionBar
          next={{
            label: messages.finish,
            onClick: () => onFinish(step.placeholderMemberCount),
          }}
        />
      }
    >
      <Stack spacing={2}>
        <Alert severity="success" sx={noticeSx}>
          {messages.createdNotice}
        </Alert>

        <Stack spacing={0.75}>
          <Typography component="h3" sx={titleSx}>
            {messages.title}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {messages.description}
          </Typography>
        </Stack>

        {step.status === "loading" ? (
          <LoadingState description={null} title={messages.loading} />
        ) : step.status === "error" || !step.members ? (
          <ErrorState
            action={
              <Button onClick={step.retry} variant="outlined">
                {messages.retry}
              </Button>
            }
            description={step.errorMessage}
            title={messages.loadErrorTitle}
          />
        ) : (
          <LedgerInvitePendingProvider
            pendingInvites={step.members.pendingInvites}
          >
            <SoftCard sx={cardSx}>
              <Stack spacing={1.25}>
                <LedgerInviteEntry
                  action={step.inviteAction}
                  canInvite
                  ledgerId={ledgerId}
                  ledgerName={ledgerName}
                  placeholderMemberActions={step.placeholderMemberActions}
                  placeholderMembers={step.members.placeholderMembers}
                />
              </Stack>
            </SoftCard>
          </LedgerInvitePendingProvider>
        )}

        <Typography color="text.secondary" variant="body2">
          {placeholderMemberText.notMemberNote}
        </Typography>
      </Stack>
    </LedgerSetupStepLayout>
  );
}

const noticeSx = {
  borderRadius: `${designTokens.radius.item}px`,
  fontWeight: 700,
};

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
  fontWeight: 900,
};

const cardSx = {
  borderRadius: `${designTokens.radius.lg}px`,
  p: { xs: 1.5, sm: 1.75 },
};
