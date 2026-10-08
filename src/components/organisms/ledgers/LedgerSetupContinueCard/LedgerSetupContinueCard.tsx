"use client";

import { useState } from "react";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { LedgerSetupAbandonButton } from "organisms/ledgers/LedgerSetupAbandonButton/LedgerSetupAbandonButton";
import type { LedgerSetupAbandonAction } from "types/ledgers";
import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerSetupEntryMessages } from "config/ledgerSetupMessages";
import { getLedgerSetupProgressSummary } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupProgressSummary";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";
import type { LedgerSetupInProgressSummary } from "types/ledgers";

const messages = ledgerSetupEntryMessages;

type LedgerSetupContinueCardProps = {
  abandonAction: LedgerSetupAbandonAction;
  onAbandoned: () => void;
  onContinue: () => void;
  setup: LedgerSetupInProgressSummary;
};

/** 首页「继续创建」卡片：当前没有已完成账本、但有创建中账本时显示。 */
export function LedgerSetupContinueCard({
  abandonAction,
  onAbandoned,
  onContinue,
  setup,
}: LedgerSetupContinueCardProps) {
  const [busy, setBusy] = useState(false);
  const progress = getLedgerSetupProgressSummary(setup.step);
  const title = messages.continueCardTitle(setup.name);

  return (
    <SoftCard aria-label={title} component="section" sx={cardSx}>
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box aria-hidden="true" sx={iconSx}>
            <MenuBookRoundedIcon />
          </Box>
          <Stack spacing={0.4} sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="h2" sx={titleSx}>
              {title}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {progress.description}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <LinearProgress
            aria-label={messages.progressLabel}
            aria-valuetext={progress.stepCountText}
            sx={progressSx}
            value={Math.round(progress.ratio * 100)}
            variant="determinate"
          />
          <Typography color="text.secondary" sx={stepCountSx}>
            {progress.stepCountText}
          </Typography>
        </Stack>

        <PrimaryActionButton disabled={busy} fullWidth onClick={onContinue}>
          {messages.continue}
        </PrimaryActionButton>
        <LedgerSetupAbandonButton
          onBusyChange={setBusy}
          action={abandonAction}
          ledgerId={setup.id}
          ledgerName={setup.name}
          onSuccess={onAbandoned}
        />
      </Stack>
    </SoftCard>
  );
}

const accentColor = "var(--user-theme-field-card-selected-border)";

const cardSx = {
  backgroundColor: "var(--user-theme-field-card-selected-bg)",
  borderRadius: `${designTokens.radius.xl}px`,
  p: 2,
};

// 小插画：与账本管理页的账本图标一致使用 MUI 图标，不引入位图。
const iconSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-card-bg)",
  borderRadius: "50%",
  color: accentColor,
  display: "inline-flex",
  flexShrink: 0,
  height: 52,
  justifyContent: "center",
  width: 52,
  "& .MuiSvgIcon-root": {
    fontSize: 30,
  },
};

const titleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 17,
  fontWeight: 900,
  overflowWrap: "anywhere",
};

const progressSx = {
  bgcolor: "var(--user-theme-card-bg)",
  borderRadius: `${designTokens.radius.full}px`,
  flex: 1,
  height: 6,
  "& .MuiLinearProgress-bar": {
    bgcolor: accentColor,
    borderRadius: `${designTokens.radius.full}px`,
  },
};

const stepCountSx = {
  flexShrink: 0,
  fontSize: 12,
  fontWeight: 700,
};
