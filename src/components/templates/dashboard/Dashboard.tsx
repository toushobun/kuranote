"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";

import { IconBadge } from "atoms/ui/IconBadge";
import { ledgerSetupEntryMessages } from "config/ledgerSetupMessages";
import { SectionCard } from "molecules/ui/SectionCard";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { DashboardMonthSummaryCard } from "organisms/dashboard/DashboardMonthSummaryCard/DashboardMonthSummaryCard";
import { DashboardRecentTransactions } from "organisms/dashboard/DashboardRecentTransactions/DashboardRecentTransactions";
import { LedgerSetupContinueCard } from "organisms/ledgers/LedgerSetupContinueCard/LedgerSetupContinueCard";
import { LedgerSetupWizardLauncher } from "organisms/ledgers/LedgerSetupWizardLauncher/LedgerSetupWizardLauncher";
import { useLedgerSetupWizardLauncher } from "organisms/ledgers/LedgerSetupWizardLauncher/useLedgerSetupWizardLauncher";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";
import type { DashboardViewData } from "types/dashboard";
import type {
  LedgerSetupAbandonAction,
  LedgerSetupInProgressSummary,
  LedgerSetupWizardLauncherActions,
} from "types/ledgers";
import { formatNumber } from "utils/transactions";

import { dashboardHeroLayout as heroLayout } from "./dashboardLayout";

const incomeColor = "var(--user-theme-income-amount)";
const expenseColor = "var(--user-theme-negative-amount)";
const balanceColor = "var(--user-theme-stat-value-1)";
const primaryText = "var(--user-theme-balance-text)";
const secondaryText = "var(--user-theme-secondary-text)";
const actionText = "var(--user-theme-action-text)";
const inactiveActionText = "var(--user-theme-bottom-nav-inactive)";
const activeIconBackground = "var(--user-theme-bottom-nav-active-bg)";
const inactiveIconBackground = "var(--user-theme-segment-bg)";

type QuickAction = {
  href?: string;
  icon: ReactNode;
  id: string;
  label: string;
  requiresLedger?: boolean;
};

type DashboardTemplateProps = {
  data: DashboardViewData;
  /** 没有已完成账本时的创建中账本；有已完成账本时不读取，为 null。 */
  setupInProgress?: LedgerSetupInProgressSummary | null;
  setupWizardActions: LedgerSetupWizardLauncherActions;
};

export function DashboardTemplate({
  data,
  setupInProgress = null,
  setupWizardActions,
}: DashboardTemplateProps) {
  const { accountSummaries, monthLabel, monthSummary, recentTransactions } =
    data;
  const hasLedger = data.hasLedger ?? true;
  // 只有在没有已完成账本时才提示继续创建。
  const continueSetup = hasLedger ? null : setupInProgress;
  const setupWizard = useLedgerSetupWizardLauncher(setupWizardActions);

  return (
    <DashboardContentFrame>
      <DashboardHeroPanel
        abandonAction={setupWizardActions.wizard.abandonSetup}
        onAbandoned={setupWizard.closeWizard}
        balance={monthSummary.balance}
        continueSetup={continueSetup}
        expense={monthSummary.expense}
        hasLedger={hasLedger}
        income={monthSummary.income}
        onOpenSetupWizard={() => setupWizard.openWizard("resume")}
      />

      <DashboardMonthSummaryCard
        accounts={accountSummaries}
        hasLedger={hasLedger}
        monthLabel={monthLabel}
        onCreateLedger={() => setupWizard.openWizard("create")}
      />

      <DashboardQuickActions hasLedger={hasLedger} />

      <DashboardRecentTransactions
        hasLedger={hasLedger}
        transactions={recentTransactions}
      />

      <LedgerSetupWizardLauncher launcher={setupWizard} />
    </DashboardContentFrame>
  );
}

function DashboardContentFrame({ children }: { children: ReactNode }) {
  return (
    <SectionCard
      component="section"
      data-testid="dashboard-fullscreen-frame"
      sx={{
        background: "var(--user-theme-page-bg)",
        border: 0,
        borderRadius: heroLayout.containerBorderRadius,
        boxShadow: "none",
        mb: bottomNavigationLayout.shellPaddingBottomOffset,
        minHeight: "100dvh",
        mx: { xs: -2, sm: "calc(50% - 50vw)" },
        // AppShell Container 的 py: 4，此处用负 margin 抵消使首页内容从顶部开始。
        mt: -4,
        overflow: "hidden",
        px: heroLayout.containerPadding,
        pb: bottomNavigationLayout.dashboardContentPaddingBottom,
        pt: heroLayout.containerPadding,
        position: "relative",
        width: { xs: "calc(100% + 32px)", sm: "100vw" },
      }}
    >
      <DashboardHeroBackground />
      <Stack spacing={1.8} sx={{ position: "relative", zIndex: 2 }}>
        {children}
      </Stack>
    </SectionCard>
  );
}

function DashboardHeroPanel({
  abandonAction,
  onAbandoned,
  balance,
  continueSetup,
  expense,
  hasLedger,
  income,
  onOpenSetupWizard,
}: {
  abandonAction: LedgerSetupAbandonAction;
  onAbandoned: () => void;
  balance: string;
  continueSetup: LedgerSetupInProgressSummary | null;
  expense: string;
  hasLedger: boolean;
  income: string;
  onOpenSetupWizard: () => void;
}) {
  return (
    <Stack spacing={0}>
      <DashboardWelcomeHero
        hasLedger={hasLedger}
        hasSetupInProgress={continueSetup !== null}
      />

      {continueSetup ? (
        <LedgerSetupContinueCard
          abandonAction={abandonAction}
          onAbandoned={onAbandoned}
          onContinue={onOpenSetupWizard}
          setup={continueSetup}
        />
      ) : null}

      <DashboardIncomeExpenseSummary
        balance={balance}
        expense={expense}
        hasLedger={hasLedger}
        income={income}
      />
    </Stack>
  );
}

function DashboardHeroBackground() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        height: heroLayout.backgroundHeight,
        left: 0,
        maskImage: "linear-gradient(to bottom, black 68%, transparent 100%)",
        overflow: "hidden",
        pointerEvents: "none",
        position: "absolute",
        right: 0,
        top: 0,
        WebkitMaskImage:
          "linear-gradient(to bottom, black 68%, transparent 100%)",
        zIndex: 0,
      }}
    >
      <Box
        data-testid="dashboard-hero-illustration"
        sx={{
          backgroundImage: "var(--user-theme-dashboard-hero-image)",
          backgroundPosition: { xs: "center top", sm: "center center" },
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          bottom: 0,
          left: 0,
          pointerEvents: "none",
          position: "absolute",
          right: 0,
          top: 0,
        }}
      />
      <Box
        sx={{
          background:
            "linear-gradient(to right, var(--user-theme-card-bg), transparent)",
          bottom: 0,
          left: 0,
          opacity: heroLayout.overlayOpacity,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          width: heroLayout.overlayWidth,
        }}
      />
    </Box>
  );
}

function DashboardWelcomeHero({
  hasLedger,
  hasSetupInProgress,
}: {
  hasLedger: boolean;
  hasSetupInProgress: boolean;
}) {
  const { greeting, subtitle } = getWelcomeText(hasLedger, hasSetupInProgress);

  return (
    <Stack
      sx={{
        height: heroLayout.welcomeHeight,
        maxWidth: heroLayout.welcomeMaxWidth,
        pl: heroLayout.welcomePaddingLeft,
        pr: heroLayout.welcomePaddingRight,
        pt: heroLayout.welcomePaddingTop,
      }}
    >
      <Typography
        component="p"
        sx={{
          ...typographyStyles.brandTitle,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          backgroundImage: "var(--user-theme-title-gradient)",
          color: "transparent",
          fontSize: heroLayout.titleFontSize,
          textShadow: "none",
        }}
      >
        KuraNote
      </Typography>
      <Stack
        spacing={heroLayout.greetingSpacing}
        sx={{
          flex: 1,
          justifyContent: "center",
          pl: heroLayout.greetingPaddingLeft,
        }}
      >
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
          <Typography
            sx={{
              ...typographyStyles.cardTitle,
              color: primaryText,
              fontSize: heroLayout.greetingFontSize,
              textShadow: "0 1px 8px var(--user-theme-card-bg)",
            }}
          >
            {greeting}
          </Typography>
          <WbSunnyRoundedIcon
            sx={{
              color: "warning.main",
              fontSize: heroLayout.greetingFontSize,
            }}
          />
        </Box>
        <Typography
          sx={{
            ...typographyStyles.body,
            color: secondaryText,
            fontSize: heroLayout.subtitleFontSize,
            textShadow: "0 1px 8px var(--user-theme-card-bg)",
          }}
        >
          {subtitle}
        </Typography>
      </Stack>
    </Stack>
  );
}

function getWelcomeText(hasLedger: boolean, hasSetupInProgress: boolean) {
  if (hasLedger) {
    return {
      greeting: "早呀，今天也好好记录",
      subtitle: "每一张小票，都是生活的线索",
    };
  }

  if (hasSetupInProgress) {
    return {
      greeting: ledgerSetupEntryMessages.dashboardTitle,
      subtitle: ledgerSetupEntryMessages.dashboardSubtitle,
    };
  }

  return {
    greeting: "先创建你的第一个账本",
    subtitle: "创建账本后，就可以开始记录家庭收支了",
  };
}

function DashboardIncomeExpenseSummary({
  balance,
  expense,
  hasLedger,
  income,
}: {
  balance: string;
  expense: string;
  hasLedger: boolean;
  income: string;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 0.7,
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        mt: { xs: 1.8, sm: 2 },
      }}
    >
      <DashboardSummaryPill
        color={incomeColor}
        isPlaceholder={!hasLedger}
        label="本月收入"
        value={income}
      />
      <DashboardSummaryPill
        color={expenseColor}
        isPlaceholder={!hasLedger}
        label="本月支出"
        value={expense}
      />
      <DashboardSummaryPill
        color={balanceColor}
        isPlaceholder={!hasLedger}
        label="本月结余"
        value={balance}
      />
    </Box>
  );
}

function DashboardSummaryPill({
  color,
  isPlaceholder = false,
  label,
  value,
}: {
  color: string;
  isPlaceholder?: boolean;
  label: string;
  value: string;
}) {
  return (
    <SectionCard
      sx={{
        borderRadius: `${designTokens.radius.lg}px`,
        minWidth: 0,
        px: { xs: 0.8, sm: 1.2 },
        py: 1.05,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{ ...typographyStyles.chipBadge, color, fontSize: 11, mb: 0.3 }}
      >
        {label}
      </Typography>
      <Typography
        noWrap
        sx={{
          ...typographyStyles.amount,
          color,
          fontSize: { xs: 14, sm: 18 },
        }}
      >
        {/* TODO: 暂时以日元固定显示，后续需根据 currency 字段使用 formatAmount */}
        {isPlaceholder ? "—" : `¥ ${formatNumber(value)}`}
      </Typography>
    </SectionCard>
  );
}

function DashboardQuickActions({ hasLedger }: { hasLedger: boolean }) {
  const actions: QuickAction[] = [
    {
      icon: <ReceiptLongRoundedIcon fontSize="small" />,
      id: "quick-entry",
      label: "快速记账",
      requiresLedger: true,
    },
    {
      icon: <CameraAltRoundedIcon fontSize="small" />,
      id: "photo-entry",
      label: "拍照记账",
      requiresLedger: true,
    },
    {
      icon: <AddRoundedIcon fontSize="small" />,
      id: "coming-soon-1",
      label: "敬请期待",
    },
    {
      icon: <AddRoundedIcon fontSize="small" />,
      id: "coming-soon-2",
      label: "敬请期待",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 0.75,
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      }}
    >
      {actions.map((action) => {
        const isActive = Boolean(action.href);
        const shouldShowLedgerCaption = !hasLedger && action.requiresLedger;
        const content = (
          <SectionCard
            sx={{
              borderRadius: `${designTokens.radius.lg}px`,
              color: isActive ? actionText : inactiveActionText,
              minHeight: shouldShowLedgerCaption ? 74 : 68,
              px: 0.7,
              py: 1,
              textAlign: "center",
            }}
          >
            <Stack spacing={0.5} sx={{ alignItems: "center" }}>
              <IconBadge
                size="sm"
                sx={{
                  backgroundColor: isActive
                    ? activeIconBackground
                    : inactiveIconBackground,
                  color: isActive ? actionText : secondaryText,
                  height: 28,
                  width: 28,
                }}
              >
                {action.icon}
              </IconBadge>
              <Typography sx={{ ...typographyStyles.button, fontSize: 11 }}>
                {action.label}
              </Typography>
              {shouldShowLedgerCaption ? (
                <Typography sx={{ color: secondaryText, fontSize: 10 }}>
                  需先创建账本
                </Typography>
              ) : null}
            </Stack>
          </SectionCard>
        );

        return action.href ? (
          <Box
            component={Link}
            href={action.href}
            key={action.id}
            sx={{ color: "inherit", textDecoration: "none" }}
          >
            {content}
          </Box>
        ) : (
          <Box key={action.id}>{content}</Box>
        );
      })}
    </Box>
  );
}
