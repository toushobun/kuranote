"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createElement,
  type ElementType,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import { CreateButton } from "atoms/ui/CreateButton";
import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerSettingsHref, routePaths } from "config/paths";
import type { CurrentLedgerRole, LedgerWithMemberCount } from "internal/ledger";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { PageShell } from "templates/layout/PageShell";
import { fullViewportPageBackgroundSx } from "templates/layout/fullViewportPageBackgroundSx";
import { typographyStyles } from "theme/typographyTokens";
import type { ServerAction } from "types/actions";

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
  const router = useRouter();

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

    const url = new URL(window.location.href);
    url.searchParams.delete("result");
    router.replace(`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    });
  }

  return (
    <>
      <Box
        aria-hidden="true"
        data-testid="ledgers-page-background"
        sx={fullViewportPageBackgroundSx}
      />
      <PageShell maxWidth="xs" sx={ledgersPageShellSx}>
        <Stack spacing={2.1}>
          <Stack spacing={0.45}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <IconButton
                aria-label="返回"
                component={Link}
                href={routePaths.settings}
                sx={headerIconButtonSx}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
              <Typography component="h1" sx={pageTitleSx}>
                账本管理
              </Typography>
              <CreateButton href={routePaths.ledgersNew} sx={createButtonSx}>
                新增账本
              </CreateButton>
            </Stack>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ pl: 5.75 }}
            >
              查看和管理你加入的账本
            </Typography>
          </Stack>

          {currentLedger ? (
            <CurrentLedgerCard ledger={currentLedger} />
          ) : (
            <LedgersEmptyCard />
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
            </Stack>

            {ledgers.length > 1 ? <LedgerSwitchHint /> : null}
          </Stack>
        </Stack>

        {errorFeedbacks.map((feedback, index) => (
          <FailureFeedbackDialog
            bottomOffset={errorFeedbackBottomOffset(index)}
            description={feedback.message}
            key={feedback.id}
            onClose={() => closeErrorFeedback(feedback.id)}
            open
            title="账本切换失败"
          />
        ))}
        <SuccessFeedbackDialog
          bottomOffset={feedbackBottomOffset}
          description={
            currentLedger
              ? `已切换至「${currentLedger.name}」。`
              : "当前账本已切换。"
          }
          onClose={closeSwitchSuccessDialog}
          open={isSwitchSuccessOpen}
          title="切换成功"
        />
      </PageShell>
    </>
  );
}

function CurrentLedgerCard({ ledger }: { ledger: LedgerWithMemberCount }) {
  const Icon = getLedgerIcon(ledger.name, 0);

  return (
    <SoftCard component="section" aria-label="当前账本" sx={currentCardSx}>
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
    </SoftCard>
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
    <SoftCard sx={ledgerItemCardSx(isCurrent)}>
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
    </SoftCard>
  );
}

function SwitchLedgerButton({ ledgerName }: { ledgerName: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-label={`切换到${ledgerName}`}
      disabled={pending}
      size="small"
      sx={switchButtonSx}
      type="submit"
      variant="contained"
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
    </Button>
  );
}

function LedgerSwitchHint() {
  return (
    <Stack direction="row" spacing={0.9} sx={switchHintSx}>
      <TipsAndUpdatesOutlinedIcon sx={switchHintIconSx} />
      <Typography color="text.secondary" variant="body2">
        点击「切换使用」可切换当前账本，点击卡片可进入账本设置。
      </Typography>
    </Stack>
  );
}

function LedgersEmptyCard() {
  return (
    <SoftCard sx={emptyCardSx}>
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
        <CreateButton href={routePaths.ledgersNew} sx={createButtonSx}>
          新增账本
        </CreateButton>
      </Stack>
    </SoftCard>
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

const headerIconButtonSx = {
  color: "text.primary",
  mt: 0.2,
  "& .MuiSvgIcon-root": {
    fontSize: 26,
  },
};

const ledgersPageShellSx = {
  px: { xs: 2 },
  py: { xs: 2.25 },
};

const pageTitleSx = {
  ...typographyStyles.pageTitle,
  flex: 1,
  fontSize: { xs: 24, sm: 26 },
  fontWeight: 800,
};

const createButtonSx = {
  ...typographyStyles.button,
  borderRadius: 999,
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

const currentCardSx = {
  borderRadius: 1,
  px: { xs: 1.5, sm: 1.8 },
  py: { xs: 1.5, sm: 1.8 },
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
    borderRadius: 1,
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
  px: 1.5,
  py: 1.25,
  textAlign: "left",
  textDecoration: "none",
  width: "100%",
  "&:focus-visible, &:hover": {
    filter: "brightness(1.02)",
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
  background: "var(--user-theme-fab-bg)",
  borderRadius: 999,
  color: "var(--user-theme-fab-text)",
  fontSize: 13,
  fontWeight: 700,
  minHeight: 32,
  minWidth: 82,
  px: 1.35,
  whiteSpace: "nowrap",
  "&:hover": {
    background: "var(--user-theme-fab-bg)",
    filter: "brightness(1.04)",
  },
};

const statusChipSx = {
  ...typographyStyles.chipBadge,
  bgcolor: "var(--user-theme-business-completed-bg)",
  borderRadius: 999,
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

const chevronSx = {
  color: "text.secondary",
  flexShrink: 0,
  fontSize: 26,
};

const switchHintSx = {
  alignItems: "center",
  bgcolor: "action.hover",
  borderRadius: 1,
  mt: 0.35,
  px: 1.25,
  py: 1,
};

const switchHintIconSx = {
  color: "var(--user-theme-action-text)",
  flexShrink: 0,
  fontSize: 22,
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

const emptyCardSx = {
  borderRadius: 1,
  p: { xs: 1.5, sm: 1.75 },
};

const emptyTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: { xs: 16, sm: 17 },
  fontWeight: 700,
};

const feedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

function errorFeedbackBottomOffset(index: number) {
  return `calc(${feedbackBottomOffset} + ${index * 88}px)`;
}
