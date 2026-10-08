"use client";

import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import {
  createElement,
  type ElementType,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import { CreateButton } from "atoms/ui/CreateButton";
import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { DataItemCard, dataItemCardPadding } from "atoms/ui/DataItemCard";
import { ledgerPageMessages } from "config/ledgerMessages";
import { ledgerSetupEntryMessages } from "config/ledgerSetupMessages";
import { ledgerSettingsHref, routePaths } from "config/paths";
import type { CurrentLedgerRole, LedgerWithMemberCount } from "internal/ledger";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { InlineHint } from "molecules/ui/InlineHint/InlineHint";
import { getLedgerSetupProgressSummary } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupProgressSummary";
import { LedgerSetupWizardLauncher } from "organisms/ledgers/LedgerSetupWizardLauncher/LedgerSetupWizardLauncher";
import { useLedgerSetupWizardLauncher } from "organisms/ledgers/LedgerSetupWizardLauncher/useLedgerSetupWizardLauncher";
import {
  bottomNavigationLayout,
  stackedFeedbackBottomOffset,
} from "organisms/navigation/bottomNavigationLayout";
import {
  SettingsPageLayout,
  settingsPageActionButtonSx,
} from "templates/layout/SettingsPageLayout";
import { useClearQueryParam } from "templates/useClearQueryParam";
import { designTokens } from "theme/theme";
import { typographyStyles } from "theme/typographyTokens";
import type { ServerAction } from "types/actions";
import type {
  LedgerSetupInProgressSummary,
  LedgerSetupWizardLauncherActions,
} from "types/ledgers";

export type LedgerSwitchResult = "switched";

type ErrorFeedback = {
  id: string;
  message: string;
};

type LedgersTemplateProps = {
  currentLedgerId: string;
  errorKey?: string | null;
  errorMessage: string | null;
  ledgers: LedgerWithMemberCount[];
  /** 当前用户的创建中账本（每个用户最多一个）。 */
  setupInProgress?: LedgerSetupInProgressSummary | null;
  setupWizardActions: LedgerSetupWizardLauncherActions;
  switchResult?: LedgerSwitchResult | null;
  updateCurrentLedgerAction: ServerAction;
};

type LedgerIconOption = {
  icon: ElementType<SvgIconProps>;
  keyword: string;
};

const ledgerIconOptions: readonly LedgerIconOption[] = [
  { icon: HomeRoundedIcon, keyword: "家" },
  { icon: ChildCareRoundedIcon, keyword: "育儿" },
  { icon: LuggageRoundedIcon, keyword: "旅行" },
];

export function LedgersTemplate({
  currentLedgerId,
  errorKey = null,
  errorMessage,
  ledgers,
  setupInProgress = null,
  setupWizardActions,
  switchResult = null,
  updateCurrentLedgerAction,
}: LedgersTemplateProps) {
  const currentLedger =
    ledgers.find((ledger) => ledger.id === currentLedgerId) ?? ledgers[0];
  const [errorFeedbacks, setErrorFeedbacks] = useState<ErrorFeedback[]>([]);
  const [isSwitchSuccessOpen, setIsSwitchSuccessOpen] = useState(
    switchResult !== null,
  );
  const [previousSwitchResult, setPreviousSwitchResult] =
    useState(switchResult);
  const enqueuedErrorKeysRef = useRef(new Set<string>());
  const errorFeedbackIdRef = useRef(0);
  const clearResultParam = useClearQueryParam("result");
  // 「新增账本」「继续创建」共用：已有创建中账本时向导恢复到该账本，从「新增账本」打开时提示。
  const setupWizard = useLedgerSetupWizardLauncher(setupWizardActions);

  useEffect(() => {
    if (errorMessage === null || errorKey === null) return;
    if (enqueuedErrorKeysRef.current.has(errorKey)) return;
    enqueuedErrorKeysRef.current.add(errorKey);

    errorFeedbackIdRef.current += 1;
    const id = `${errorKey}-${errorFeedbackIdRef.current}`;

    setErrorFeedbacks((feedbacks) => [
      ...feedbacks,
      { id, message: errorMessage },
    ]);
  }, [errorMessage, errorKey]);

  if (switchResult !== previousSwitchResult) {
    setPreviousSwitchResult(switchResult);

    if (switchResult !== null) {
      setIsSwitchSuccessOpen(true);
    }
  }

  function closeErrorFeedback(id: string) {
    setErrorFeedbacks((feedbacks) =>
      feedbacks.filter((feedback) => feedback.id !== id),
    );
  }

  function closeSwitchSuccessDialog() {
    setIsSwitchSuccessOpen(false);

    clearResultParam();
  }

  return (
    <SettingsPageLayout
      action={
        <CreateButton
          onClick={() => setupWizard.openWizard("create")}
          size="small"
          sx={settingsPageActionButtonSx}
        >
          {ledgerPageMessages.create}
        </CreateButton>
      }
      back={{
        href: routePaths.settings,
        label: ledgerPageMessages.backToSettings,
      }}
      subtitle={ledgerPageMessages.subtitle}
      title={ledgerPageMessages.title}
    >
      <Stack spacing={2.1}>
        {currentLedger ? (
          <CurrentLedgerCard ledger={currentLedger} />
        ) : (
          <LedgersEmptyCard onCreate={() => setupWizard.openWizard("create")} />
        )}

        <Stack spacing={1}>
          <Typography component="h2" sx={sectionTitleSx}>
            我的账本列表
          </Typography>

          <Stack spacing={0.85}>
            {ledgers.map((ledger, index) => (
              <LedgerListItem
                index={index}
                isCurrent={ledger.id === currentLedgerId}
                key={ledger.id}
                ledger={ledger}
                updateCurrentLedgerAction={updateCurrentLedgerAction}
              />
            ))}
            {setupInProgress ? (
              <LedgerSetupInProgressItem
                onContinue={() => setupWizard.openWizard("resume")}
                setup={setupInProgress}
              />
            ) : null}
          </Stack>

          {ledgers.length > 1 ? <LedgerSwitchHint /> : null}
        </Stack>
      </Stack>

      {errorFeedbacks.map((feedback, index) => (
        <FailureFeedbackDialog
          bottomOffset={stackedFeedbackBottomOffset(index)}
          description={feedback.message}
          key={feedback.id}
          onClose={() => closeErrorFeedback(feedback.id)}
          open
          title="账本切换失败"
        />
      ))}
      <SuccessFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        description={
          currentLedger
            ? `已切换至「${currentLedger.name}」。`
            : "当前账本已切换。"
        }
        onClose={closeSwitchSuccessDialog}
        open={isSwitchSuccessOpen}
        title="切换成功"
      />
      <LedgerSetupWizardLauncher launcher={setupWizard} />
    </SettingsPageLayout>
  );
}

function CurrentLedgerCard({ ledger }: { ledger: LedgerWithMemberCount }) {
  const Icon = getLedgerIcon(ledger.name, 0);

  return (
    <DataItemCard component="section" aria-label="当前账本">
      <Stack spacing={1.5}>
        <Typography component="p" sx={currentCardLabelSx}>
          当前账本
        </Typography>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box sx={featuredIconBoxSx}>
            {createElement(Icon, { fontSize: "medium" })}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="p" sx={currentLedgerNameSx}>
              {ledger.name}
            </Typography>
          </Box>
          <Chip color="success" label="使用中" sx={statusChipSx} />
        </Stack>

        <Stack direction="row" spacing={0} sx={ledgerMetaRowSx}>
          <LedgerMetaItem
            icon={PeopleAltRoundedIcon}
            label="成员"
            value={`${ledger.memberCount} 人`}
          />
          <LedgerMetaItem
            icon={WalletRoundedIcon}
            label="默认货币"
            value={ledger.baseCurrency}
          />
          <LedgerMetaItem
            icon={ShieldOutlinedIcon}
            label="我的角色"
            value={roleLabelMap[ledger.currentUserRole]}
          />
        </Stack>
      </Stack>
    </DataItemCard>
  );
}

function LedgerListItem({
  index,
  isCurrent,
  ledger,
  updateCurrentLedgerAction,
}: {
  index: number;
  isCurrent: boolean;
  ledger: LedgerWithMemberCount;
  updateCurrentLedgerAction: ServerAction;
}) {
  const Icon = getLedgerIcon(ledger.name, index);
  const href = ledgerSettingsHref(ledger.id);

  return (
    <DataItemCard disablePadding sx={ledgerItemCardSx(isCurrent)}>
      <ButtonBase
        aria-label={`进入${ledger.name}设置`}
        component={Link}
        href={href}
        sx={ledgerItemButtonSx}
      >
        <Box sx={ledgerItemIconBoxSx}>
          {createElement(Icon, { fontSize: "small" })}
        </Box>

        <Stack spacing={0.35} sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="p" sx={ledgerItemNameSx}>
            {ledger.name}
          </Typography>

          <Typography color="text.secondary" variant="body2">
            成员 {ledger.memberCount} 人 · {ledger.baseCurrency} ·{" "}
            {roleLabelMap[ledger.currentUserRole]}
          </Typography>
        </Stack>

        <Box aria-hidden="true" sx={ledgerItemActionSpacerSx(isCurrent)} />
        <ChevronRightRoundedIcon sx={chevronSx} />
      </ButtonBase>

      <Box sx={ledgerItemActionOverlaySx(isCurrent)}>
        {isCurrent ? (
          <Chip color="success" label="使用中" size="small" sx={statusChipSx} />
        ) : (
          <Box
            component="form"
            action={updateCurrentLedgerAction}
            sx={switchFormSx}
          >
            <input name="ledgerId" type="hidden" value={ledger.id} />
            <SwitchLedgerButton ledgerName={ledger.name} />
          </Box>
        )}
      </Box>
    </DataItemCard>
  );
}

/**
 * 创建中账本：不能切换使用，也不进入账本设置，只提供「继续创建」打开向导。
 */
function LedgerSetupInProgressItem({
  onContinue,
  setup,
}: {
  onContinue: () => void;
  setup: LedgerSetupInProgressSummary;
}) {
  const progress = getLedgerSetupProgressSummary(setup.step);

  return (
    <DataItemCard
      aria-label={`${setup.name}（${ledgerSetupEntryMessages.inProgressLabel}）`}
      component="section"
      disablePadding
      sx={inProgressItemCardSx}
    >
      <Stack direction="row" spacing={1.25} sx={inProgressItemContentSx}>
        <Box sx={inProgressItemIconBoxSx}>
          <MenuBookRoundedIcon fontSize="small" />
        </Box>

        <Stack spacing={0.35} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Typography component="p" noWrap sx={ledgerItemNameSx}>
              {setup.name}
            </Typography>
            <Chip
              label={ledgerSetupEntryMessages.inProgressLabel}
              size="small"
              sx={inProgressChipSx}
            />
          </Stack>

          <Typography color="text.secondary" variant="body2">
            {progress.description}
          </Typography>
        </Stack>

        <Button
          aria-label={ledgerSetupEntryMessages.continueLedger(setup.name)}
          endIcon={<ChevronRightRoundedIcon />}
          onClick={onContinue}
          size="small"
          sx={continueButtonSx}
        >
          {ledgerSetupEntryMessages.continue}
        </Button>
      </Stack>
    </DataItemCard>
  );
}

function SwitchLedgerButton({ ledgerName }: { ledgerName: string }) {
  const { pending } = useFormStatus();

  return (
    <PrimaryActionButton
      aria-label={`切换到${ledgerName}`}
      disabled={pending}
      size="small"
      sx={switchButtonSx}
      type="submit"
    >
      {pending ? (
        <CircularProgress
          aria-label={`正在切换到${ledgerName}`}
          color="inherit"
          size={18}
        />
      ) : (
        "切换使用"
      )}
    </PrimaryActionButton>
  );
}

function LedgerSwitchHint() {
  return (
    <Box sx={{ mt: 0.35 }}>
      <InlineHint>
        点击「切换使用」可切换当前账本，点击卡片可进入账本设置。
      </InlineHint>
    </Box>
  );
}

function LedgersEmptyCard({ onCreate }: { onCreate: () => void }) {
  return (
    <DataItemCard>
      <Stack spacing={1.25} sx={{ alignItems: "center", textAlign: "center" }}>
        <Box sx={featuredIconBoxSx}>
          <MenuBookRoundedIcon fontSize="medium" />
        </Box>
        <Stack spacing={0.45}>
          <Typography component="p" sx={emptyTitleSx}>
            你还没有任何账本
          </Typography>
          <Typography color="text.secondary" variant="body2">
            创建第一个账本后，就可以开始整理家庭记录。
          </Typography>
        </Stack>
        <CreateButton onClick={onCreate} sx={createButtonSx}>
          {ledgerPageMessages.create}
        </CreateButton>
      </Stack>
    </DataItemCard>
  );
}

function LedgerMetaItem({
  icon,
  label,
  value,
}: {
  icon: ElementType<SvgIconProps>;
  label: string;
  value: string;
}) {
  const Icon = icon;

  return (
    <Stack direction="row" spacing={0.35} sx={ledgerMetaItemSx}>
      <Icon sx={metaIconSx} />
      <Typography color="text.secondary" variant="body2" sx={metaTextSx}>
        <Box component="span" sx={metaLabelSx}>
          {label}
        </Box>{" "}
        <Box component="span" sx={metaValueSx}>
          {value}
        </Box>
      </Typography>
    </Stack>
  );
}

function getLedgerIcon(ledgerName: string, index: number) {
  const matched = ledgerIconOptions.find((option) =>
    ledgerName.includes(option.keyword),
  );

  if (matched) {
    return matched.icon;
  }

  return ledgerFallbackIcons[index % ledgerFallbackIcons.length];
}

const ledgerFallbackIcons = [
  HomeRoundedIcon,
  LuggageRoundedIcon,
  ChildCareRoundedIcon,
  EditNoteRoundedIcon,
] as const;

const roleLabelMap: Record<CurrentLedgerRole, string> = {
  admin: "管理员",
  member: "用户",
  owner: "所有者",
  viewer: "只读",
};

const createButtonSx = {
  ...typographyStyles.button,
  borderRadius: `${designTokens.radius.full}px`,
  flexShrink: 0,
  fontSize: 14,
  fontWeight: 700,
  minHeight: 40,
  px: 2,
  whiteSpace: "nowrap",
  "& .MuiButton-startIcon": {
    mr: 0.75,
  },
  "& .MuiSvgIcon-root": {
    fontSize: 20,
  },
};

const featuredIconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 48,
  justifyContent: "center",
  width: 48,
  "& .MuiSvgIcon-root": {
    fontSize: 28,
  },
};

const currentCardLabelSx = {
  ...typographyStyles.listText,
  color: "text.primary",
  fontSize: 15,
  fontWeight: 600,
};

const currentLedgerNameSx = {
  ...typographyStyles.cardTitle,
  fontSize: { xs: 22, sm: 24 },
  fontWeight: 700,
};

const sectionTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: 17,
  fontWeight: 700,
};

function ledgerItemCardSx(isCurrent: boolean) {
  return {
    borderColor: isCurrent
      ? "var(--user-theme-action-text)"
      : "var(--user-theme-card-border)",
    overflow: "hidden",
    position: "relative",
  } as const;
}

const ledgerItemButtonSx = {
  alignItems: "center",
  color: "text.primary",
  display: "flex",
  gap: 1.25,
  justifyContent: "flex-start",
  minHeight: 76,
  p: dataItemCardPadding,
  textAlign: "left",
  textDecoration: "none",
  width: "100%",
  "&:focus-visible": {
    filter: "brightness(1.02)",
  },
  "@media (hover: hover)": {
    "&:hover": {
      filter: "brightness(1.02)",
    },
  },
};

const ledgerItemIconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 38,
  justifyContent: "center",
  width: 38,
  "& .MuiSvgIcon-root": {
    fontSize: 22,
  },
};

const ledgerItemNameSx = {
  ...typographyStyles.cardTitle,
  fontSize: { xs: 16, sm: 17 },
  fontWeight: 700,
};

function ledgerItemActionSpacerSx(isCurrent: boolean) {
  return {
    flexShrink: 0,
    width: isCurrent ? 62 : 92,
  } as const;
}

function ledgerItemActionOverlaySx(isCurrent: boolean) {
  return {
    alignItems: "center",
    display: "flex",
    pointerEvents: isCurrent ? "none" : "auto",
    position: "absolute",
    right: 42,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
  } as const;
}

const switchFormSx = {
  display: "inline-flex",
  m: 0,
};

const switchButtonSx = {
  ...typographyStyles.button,
  borderRadius: `${designTokens.radius.full}px`,
  fontSize: 13,
  fontWeight: 700,
  minHeight: 32,
  minWidth: 82,
  px: 1.35,
  whiteSpace: "nowrap",
  "&.Mui-disabled": {
    background: "var(--user-theme-fab-bg)",
    backgroundColor: "action.disabledBackground",
  },
};

const statusChipSx = {
  ...typographyStyles.chipBadge,
  bgcolor: "var(--user-theme-business-completed-bg)",
  borderRadius: `${designTokens.radius.full}px`,
  color: "var(--user-theme-business-completed-text)",
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 700,
  height: 24,
  px: 0.2,
  "& .MuiChip-label": {
    px: 0.9,
  },
};

// 创建中账本：浅米色底、橙色虚线描边，整体略淡（「继续创建」按钮保持原色）。
const inProgressItemCardSx = {
  backgroundColor: "var(--user-theme-business-pending-bg)",
  border: "1px dashed var(--user-theme-field-card-selected-border)",
};

const inProgressItemContentSx = {
  alignItems: "center",
  minHeight: 76,
  p: dataItemCardPadding,
  "& > :not(:last-child)": {
    opacity: 0.8,
  },
};

const inProgressItemIconBoxSx = {
  ...ledgerItemIconBoxSx,
  bgcolor: "var(--user-theme-segment-bg)",
  color: "var(--user-theme-field-card-selected-border)",
};

const inProgressChipSx = {
  ...typographyStyles.chipBadge,
  bgcolor: "var(--user-theme-card-bg)",
  border: "1px solid var(--user-theme-field-card-selected-border)",
  borderRadius: `${designTokens.radius.full}px`,
  color: "var(--user-theme-field-card-selected-border)",
  flexShrink: 0,
  fontSize: 11,
  fontWeight: 700,
  height: 20,
  "& .MuiChip-label": {
    px: 0.75,
  },
};

const continueButtonSx = {
  ...typographyStyles.button,
  color: "var(--user-theme-action-text)",
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 700,
  minHeight: 40,
  whiteSpace: "nowrap",
  "& .MuiButton-endIcon": {
    ml: 0,
  },
};

const chevronSx = {
  color: "text.secondary",
  flexShrink: 0,
  fontSize: 26,
};

const ledgerMetaRowSx = {
  display: "grid",
  gridTemplateColumns: "0.8fr 1.1fr 1.1fr",
  overflow: "hidden",
  px: { xs: 0.75, sm: 1 },
  py: { xs: 0.8, sm: 0.95 },
  "& > * + *": {
    borderLeft: "1px solid",
    borderColor: "divider",
    pl: { xs: 1, sm: 1.25 },
  },
};

const ledgerMetaItemSx = {
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
};

const metaIconSx = {
  color: "var(--user-theme-action-text)",
  flexShrink: 0,
  fontSize: { xs: 16, sm: 18 },
};

const metaTextSx = {
  fontSize: { xs: 12, sm: 13 },
  whiteSpace: "nowrap",
};

const metaLabelSx = {
  color: "text.secondary",
  fontWeight: 400,
};

const metaValueSx = {
  color: "text.primary",
  fontWeight: 700,
};

const emptyTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: { xs: 16, sm: 17 },
  fontWeight: 700,
};
