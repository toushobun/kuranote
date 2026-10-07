"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerSetupCompleteMessages } from "config/ledgerSetupMessages";
import { routePaths } from "config/paths";
import { LedgerSetupCompleteIllustration } from "molecules/ledgers/LedgerSetupCompleteIllustration/LedgerSetupCompleteIllustration";
import type { LedgerSetupCompletion } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { designTokens } from "theme/theme";

const messages = ledgerSetupCompleteMessages;

type LedgerSetupCompleteScreenProps = {
  completion: LedgerSetupCompletion & { placeholderMemberCount: number };
  /** 关闭向导。导航到记一笔 / 首页前也先关闭。 */
  onClose: () => void;
  /** 标题的 id，作为向导弹框的无障碍名称。 */
  titleId: string;
};

/**
 * 创建账本向导的完成页（第 6 步之后，不计入进度条）。
 * 统计来自完成写入时保存的数据与第 6 步最新读取的待邀请成员数，为 0 的项目隐藏。
 */
export function LedgerSetupCompleteScreen({
  completion,
  onClose,
  titleId,
}: LedgerSetupCompleteScreenProps) {
  const stats = [
    { count: completion.accountCount, label: messages.stats.accounts },
    { count: completion.merchantCount, label: messages.stats.merchants },
    {
      count: completion.placeholderMemberCount,
      label: messages.stats.placeholderMembers,
    },
  ].filter(({ count }) => count > 0);

  return (
    <>
      <DialogContent sx={contentSx}>
        <Stack spacing={2.5} sx={bodySx}>
          <LedgerSetupCompleteIllustration label={messages.illustrationLabel} />
          <Stack spacing={0.75}>
            <Typography component="h2" id={titleId} sx={titleSx}>
              {messages.title}
            </Typography>
            <Typography color="text.secondary" sx={descriptionSx}>
              {messages.description(completion.ledgerName)}
            </Typography>
            <Typography color="text.secondary" sx={descriptionSx}>
              {messages.hint}
            </Typography>
          </Stack>

          {stats.length > 0 ? (
            <SoftCard
              aria-label={messages.summaryLabel}
              component="section"
              sx={summaryCardSx}
            >
              <Box component="dl" sx={statListSx}>
                {stats.map(({ count, label }) => (
                  // 读屏按「标签 → 数字」读出；视觉上数字在上（column-reverse）。
                  <Box key={label} sx={statItemSx}>
                    <Typography component="dt" sx={statLabelSx}>
                      {label}
                    </Typography>
                    <Typography component="dd" sx={statCountSx}>
                      {count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </SoftCard>
          ) : null}
        </Stack>
      </DialogContent>

      <Stack spacing={1} sx={actionsSx}>
        <PrimaryActionButton
          fullWidth
          href={routePaths.transactionsNew}
          onClick={onClose}
        >
          {messages.startRecording}
        </PrimaryActionButton>
        <Button
          component={Link}
          fullWidth
          href={routePaths.dashboard}
          onClick={onClose}
          sx={secondaryButtonSx}
          variant="text"
        >
          {messages.goDashboard}
        </Button>
      </Stack>
    </>
  );
}

const contentSx = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  px: { xs: 2, sm: 3 },
  py: 3,
};

const bodySx = {
  alignItems: "center",
  textAlign: "center",
};

const titleSx = {
  color: "text.primary",
  fontSize: 24,
  fontWeight: 900,
};

const descriptionSx = {
  fontSize: 15,
  fontWeight: 700,
  overflowWrap: "anywhere",
};

const summaryCardSx = {
  borderRadius: `${designTokens.radius.lg}px`,
  px: 1,
  py: 2,
  width: "100%",
};

const statListSx = {
  display: "flex",
  m: 0,
};

const statItemSx = {
  alignItems: "center",
  display: "flex",
  flex: 1,
  flexDirection: "column-reverse",
  gap: 0.25,
  minWidth: 0,
  "& + &": {
    borderLeft: "1px solid",
    borderColor: "divider",
  },
};

const statCountSx = {
  color: "var(--user-theme-action-text)",
  fontSize: 24,
  fontWeight: 900,
  lineHeight: 1.2,
  m: 0,
};

const statLabelSx = {
  color: "text.secondary",
  fontSize: 13,
  fontWeight: 700,
};

const actionsSx = {
  bgcolor: "background.paper",
  pb: "calc(12px + env(safe-area-inset-bottom))",
  pt: 1.2,
  px: { xs: 2, sm: 3 },
};

const secondaryButtonSx = {
  color: "text.secondary",
  fontWeight: 800,
  minHeight: 44,
};
