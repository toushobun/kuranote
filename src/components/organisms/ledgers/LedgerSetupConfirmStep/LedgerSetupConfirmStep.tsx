"use client";

import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import {
  ledgerSetupConfirmMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import { ActionFailureFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { WizardActionBar } from "molecules/ui/WizardActionBar/WizardActionBar";
import { LedgerSetupStepLayout } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupStepLayout";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { designTokens } from "theme/theme";
import { themeColorTokens } from "theme/themeColorTokens";
import { typographyStyles } from "theme/typographyTokens";
import type { LedgerSetupProgress } from "types/ledgers";

import { LedgerSetupSummaryCard } from "./LedgerSetupSummaryCard";
import { useLedgerSetupConfirmStep } from "./useLedgerSetupConfirmStep";

const messages = ledgerSetupConfirmMessages;

/** 「修改」跳转的目标步骤。 */
const editSteps = {
  accounts: 2,
  basicInfo: 1,
  features: 4,
  merchants: 3,
} as const;

/** 分类卡片收起时显示的大分类数量。 */
const collapsedCategoryCount = 6;

/**
 * 向导第 5 步「确认一览」：汇总将创建的内容，「完成创建」时写入默认数据并切换为当前账本。
 * 第 5 步只能在第 1 步创建账本后进入，因此始终有进度。
 */
export function LedgerSetupConfirmStep({
  progress,
  ...props
}: LedgerSetupWizardStepProps) {
  if (!progress) return null;

  return <LedgerSetupConfirmStepContent {...props} progress={progress} />;
}

function LedgerSetupConfirmStepContent({
  defaultRootCategoryNames,
  onGoToStep,
  onPrevious,
  ...props
}: Omit<LedgerSetupWizardStepProps, "progress"> & {
  progress: LedgerSetupProgress;
}) {
  const step = useLedgerSetupConfirmStep(props);
  const { accounts, basicInfo, merchants, specialStatusEnabled } = step.summary;
  const colorToken = themeColorTokens[basicInfo.displayColor];

  return (
    <LedgerSetupStepLayout
      actions={
        <WizardActionBar
          next={{
            disabled: step.isUnavailable,
            label: messages.complete,
            loading: step.isCompleting,
            loadingLabel: messages.completing,
            onClick: step.complete,
          }}
          // 草稿在确认一览中没有修改，返回上一步无需保存。
          previous={{
            disabled: step.isLocked,
            label: ledgerSetupWizardMessages.previous,
            onClick: onPrevious,
          }}
        />
      }
    >
      <Stack spacing={2}>
        <Stack spacing={0.75}>
          <Typography component="h3" sx={titleSx}>
            {messages.title}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {messages.description(basicInfo.ledgerName)}
          </Typography>
        </Stack>

        <LedgerSetupSummaryCard
          editDisabled={step.isLocked}
          icon={<MenuBookRoundedIcon />}
          onEdit={() => onGoToStep(editSteps.basicInfo)}
          title={messages.basicInfo.title}
        >
          <Stack direction="row" spacing={1} sx={basicInfoRowSx}>
            <Typography sx={bodyTextSx}>
              {[
                basicInfo.ledgerName,
                basicInfo.currencyLabel,
                basicInfo.displayName,
              ].join(" · ")}
            </Typography>
            <Box
              aria-label={messages.basicInfo.colorLabel(colorToken.label)}
              role="img"
              sx={colorDotSx(colorToken.accent)}
            />
          </Stack>
        </LedgerSetupSummaryCard>

        <LedgerSetupSummaryCard
          description={
            accounts.skipped ? messages.accounts.skippedDescription : undefined
          }
          editDisabled={step.isLocked}
          icon={<AccountBalanceWalletRoundedIcon />}
          onEdit={() => onGoToStep(editSteps.accounts)}
          skipped={accounts.skipped}
          title={
            accounts.skipped
              ? messages.accounts.title
              : messages.accounts.titleWithCount(accounts.names.length)
          }
        >
          {accounts.skipped ? null : (
            <ChipList>
              {accounts.names.map((name, index) => (
                <Chip
                  key={`${name}-${index}`}
                  label={name}
                  size="small"
                  sx={chipSx}
                  variant="outlined"
                />
              ))}
            </ChipList>
          )}
        </LedgerSetupSummaryCard>

        <LedgerSetupSummaryCard
          description={
            merchants.skipped
              ? messages.merchants.skippedDescription
              : undefined
          }
          editDisabled={step.isLocked}
          icon={<StorefrontRoundedIcon />}
          onEdit={() => onGoToStep(editSteps.merchants)}
          skipped={merchants.skipped}
          title={
            merchants.skipped
              ? messages.merchants.title
              : messages.merchants.titleWithCount(merchants.count)
          }
        >
          {merchants.skipped ? null : (
            <ChipList>
              {merchants.tags.map((tag) => (
                <Chip
                  aria-label={messages.merchants.tagCountLabel(
                    tag.name,
                    tag.count,
                  )}
                  key={tag.key}
                  label={`${tag.icon} ${tag.count}`}
                  size="small"
                  sx={chipSx}
                  variant="outlined"
                />
              ))}
            </ChipList>
          )}
        </LedgerSetupSummaryCard>

        <LedgerSetupSummaryCard
          description={messages.categories.description}
          icon={<CategoryRoundedIcon />}
          title={messages.categories.title}
        >
          <CategorySummary names={defaultRootCategoryNames} />
        </LedgerSetupSummaryCard>

        <LedgerSetupSummaryCard
          editDisabled={step.isLocked}
          icon={<TuneRoundedIcon />}
          onEdit={() => onGoToStep(editSteps.features)}
          title={messages.features.title}
        >
          <Typography sx={bodyTextSx}>
            {`${messages.features.specialStatus} · ${
              specialStatusEnabled
                ? messages.features.enabled
                : messages.features.disabled
            }`}
          </Typography>
        </LedgerSetupSummaryCard>
      </Stack>

      <ActionFailureFeedback
        state={step.failureState}
        title={messages.completeErrorTitle}
      />
    </LedgerSetupStepLayout>
  );
}

function ChipList({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" sx={chipListSx}>
      {children}
    </Stack>
  );
}

/** 默认大分类：先显示前几个，「等 N 个」展开全部。 */
function CategorySummary({ names }: { names: readonly string[] }) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = names.length > collapsedCategoryCount;
  const visibleNames =
    collapsible && !expanded ? names.slice(0, collapsedCategoryCount) : names;

  return (
    <ChipList>
      {visibleNames.map((name) => (
        <Chip
          key={name}
          label={name}
          size="small"
          sx={chipSx}
          variant="outlined"
        />
      ))}
      {collapsible && !expanded ? (
        <Chip
          aria-label={messages.categories.showAllLabel(names.length)}
          clickable
          label={messages.categories.more(names.length)}
          onClick={() => setExpanded(true)}
          size="small"
          sx={moreChipSx}
        />
      ) : null}
    </ChipList>
  );
}

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
  fontWeight: 900,
};

const bodyTextSx = {
  fontWeight: 700,
  minWidth: 0,
  overflowWrap: "anywhere",
};

const basicInfoRowSx = {
  alignItems: "center",
};

function colorDotSx(accent: string) {
  return {
    bgcolor: accent,
    borderRadius: "50%",
    flexShrink: 0,
    height: 14,
    width: 14,
  };
}

const chipListSx = {
  flexWrap: "wrap",
  gap: 0.75,
};

const chipSx = {
  borderRadius: `${designTokens.radius.item}px`,
  fontWeight: 700,
  height: 30,
};

const moreChipSx = {
  ...chipSx,
  bgcolor: "var(--user-theme-icon-badge-bg)",
  color: "var(--user-theme-action-text)",
  fontWeight: 800,
};
