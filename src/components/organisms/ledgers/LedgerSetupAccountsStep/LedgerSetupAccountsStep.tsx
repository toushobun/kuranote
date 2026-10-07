"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Fragment } from "react";

import { AccountTypeIcon } from "atoms/accounts/AccountTypeIcon/AccountTypeIcon";
import { IconBadge } from "atoms/ui/IconBadge";
import { SoftCard } from "atoms/ui/SoftCard";
import {
  ledgerSetupAccountsMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { ledgerSetupLimits } from "internal/ledger";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { LedgerSetupAccountAddSheet } from "organisms/ledgers/LedgerSetupAccountAddSheet/LedgerSetupAccountAddSheet";
import { LedgerSetupStepLayout } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";
import type { LedgerSetupProgress } from "types/ledgers";

import { useLedgerSetupAccountsStep } from "./useLedgerSetupAccountsStep";

/**
 * 向导第 2 步「账户」：按类型勾选或添加账户。保存草稿时只保存勾选的账户。
 * 第 2 步只能在第 1 步创建账本后进入，因此始终有进度。
 */
export function LedgerSetupAccountsStep({
  progress,
  ...props
}: LedgerSetupWizardStepProps) {
  if (!progress) return null;

  return <LedgerSetupAccountsStepContent {...props} progress={progress} />;
}

function LedgerSetupAccountsStepContent(
  props: Omit<LedgerSetupWizardStepProps, "progress"> & {
    progress: LedgerSetupProgress;
  },
) {
  const step = useLedgerSetupAccountsStep(props);

  return (
    <LedgerSetupStepLayout
      actions={
        <WizardActionBar
          next={{
            label:
              step.checkedCount > 0
                ? ledgerSetupAccountsMessages.nextWithCount(step.checkedCount)
                : ledgerSetupWizardMessages.next,
            loading: step.isSaving,
            loadingLabel: ledgerSetupWizardMessages.submitting,
            onClick: step.goNext,
          }}
          previous={{
            disabled: step.isSaving,
            label: ledgerSetupWizardMessages.previous,
            onClick: step.goPrevious,
          }}
          skip={{
            disabled: step.isSaving,
            label: ledgerSetupWizardMessages.skip,
            onClick: step.skip,
          }}
        />
      }
    >
      <Stack spacing={2}>
        <Stack spacing={0.75}>
          <Typography component="h3" sx={titleSx}>
            {ledgerSetupAccountsMessages.title}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {ledgerSetupAccountsMessages.description}
          </Typography>
          {step.limitReached ? (
            <Typography color="warning.main" role="status" variant="body2">
              {ledgerSetupAccountsMessages.limitReached(
                ledgerSetupLimits.maxAccounts,
              )}
            </Typography>
          ) : null}
        </Stack>

        {step.groups.map((group) => (
          <SoftCard
            aria-label={group.label}
            component="section"
            key={group.type}
            sx={cardSx}
          >
            <Stack direction="row" sx={cardHeaderSx}>
              <IconBadge size="sm">
                <AccountTypeIcon type={group.type} />
              </IconBadge>
              <Typography component="h4" sx={cardTitleSx}>
                {group.label}
              </Typography>
              <Button
                aria-label={ledgerSetupAccountsMessages.addTypeLabel(
                  group.label,
                )}
                disabled={step.limitReached || step.isSaving}
                onClick={() => step.openAddSheet(group.type)}
                size="small"
                startIcon={<AddRoundedIcon />}
                sx={addButtonSx}
                variant="text"
              >
                {ledgerSetupAccountsMessages.add}
              </Button>
            </Stack>
            {group.rows.map((row) => (
              <Fragment key={row.key}>
                <Divider />
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={row.checked}
                        disabled={step.isSaving}
                        onChange={() => step.toggleRow(row.key)}
                      />
                    }
                    label={row.name}
                    labelPlacement="start"
                    sx={rowSx}
                  />
                  {row.error ? (
                    <FormHelperText error sx={rowErrorSx}>
                      {row.error}
                    </FormHelperText>
                  ) : null}
                </Box>
              </Fragment>
            ))}
          </SoftCard>
        ))}
      </Stack>

      <LedgerSetupAccountAddSheet
        accounts={step.addSheet.accounts}
        candidates={step.addSheet.candidates}
        onAdd={step.addSheet.onAdd}
        onClose={step.addSheet.onClose}
        open={step.addSheet.open}
        type={step.addSheet.type}
      />
      <ActionFailureFeedback
        state={step.failureState}
        title={ledgerSetupWizardMessages.saveErrorTitle}
      />
    </LedgerSetupStepLayout>
  );
}

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
  fontWeight: 900,
};

const cardSx = {
  borderRadius: `${designTokens.radius.xl}px`,
  px: { xs: 1.6, sm: 2 },
  py: 1,
};

const cardHeaderSx = {
  alignItems: "center",
  gap: 1.25,
  minHeight: 48,
};

const cardTitleSx = {
  flex: 1,
  fontSize: 16,
  fontWeight: 800,
};

const addButtonSx = {
  color: "var(--user-theme-action-text)",
  fontWeight: 800,
};

// 整行可点击，保证适合手指点击的高度。
const rowSx = {
  justifyContent: "space-between",
  minHeight: 52,
  mx: 0,
  width: "100%",
  "& .MuiFormControlLabel-label": {
    fontWeight: 700,
    minWidth: 0,
    overflowWrap: "anywhere",
  },
};

const rowErrorSx = {
  mb: 1,
  mt: -0.5,
};
