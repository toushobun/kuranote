"use client";

import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CurrencyYenRoundedIcon from "@mui/icons-material/CurrencyYenRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import {
  ledgerInviteErrorOperations,
  routePaths,
  type LedgerInviteErrorOperation,
} from "config/paths";
import { ListRowButton } from "molecules/ui/ListRowButton";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import {
  AccountDialogIllustrationSlot,
  AccountFormDialogShell,
} from "organisms/accounts/AccountFormDialogShell";
import { LedgerInviteEntry } from "organisms/ledgers/LedgerInviteEntry";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { PageShell } from "templates/layout/PageShell";
import { themeColorTokens, type ThemeColorKey } from "theme/themeColorTokens";
import { typographyStyles } from "theme/typographyTokens";
import type { ServerAction } from "types/actions";
import {
  ledgerCurrencyOptions,
  ledgerMemberColorOptions,
  ledgerRoleLabels,
  ledgerRoleOptions,
  type LedgerSettingsMember,
  type LedgerSettingsView,
} from "types/ledgers";

export type LedgerSettingsSaveResult = "updated";

type ErrorFeedback = {
  id: string;
  message: string;
};

const ledgerSettingsFormId = "ledger-settings-form";

type LedgerSettingsTemplateProps = LedgerSettingsView & {
  errorKey?: string | null;
  errorMessage: string | null;
  inviteAction: ServerAction;
  inviteErrorKey?: string | null;
  inviteErrorMessage?: string | null;
  inviteErrorOperation?: LedgerInviteErrorOperation;
  inviteToken?: string | null;
  saveResult?: LedgerSettingsSaveResult | null;
  updateLedgerSettingsAction: ServerAction;
};

export function LedgerSettingsTemplate({
  canEditLedger,
  currentUser,
  errorKey = null,
  errorMessage,
  inviteAction,
  inviteErrorKey = null,
  inviteErrorMessage = null,
  inviteErrorOperation = ledgerInviteErrorOperations.create,
  inviteToken = null,
  ledger,
  members,
  saveResult = null,
  updateLedgerSettingsAction,
}: LedgerSettingsTemplateProps) {
  const [errorFeedbacks, setErrorFeedbacks] = useState<ErrorFeedback[]>([]);
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(
    saveResult !== null,
  );
  const [previousSaveResult, setPreviousSaveResult] = useState(saveResult);
  const [selectedMember, setSelectedMember] =
    useState<LedgerSettingsMember | null>(null);
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

  if (saveResult !== previousSaveResult) {
    setPreviousSaveResult(saveResult);

    if (saveResult !== null) {
      setIsSaveSuccessOpen(true);
    }
  }

  function closeErrorFeedback(id: string) {
    setErrorFeedbacks((feedbacks) =>
      feedbacks.filter((feedback) => feedback.id !== id),
    );

    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("errorKey");
    router.replace(`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    });
  }

  function closeSaveSuccessDialog() {
    setIsSaveSuccessOpen(false);

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
        data-testid="ledger-settings-page-background"
        sx={pageBackgroundSx}
      />
      <PageShell maxWidth="xs" sx={pageShellSx}>
        <Stack spacing={1.45} sx={formSx}>
          <Stack spacing={1.2} sx={headerSx}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <IconButton
                aria-label="返回"
                component={Link}
                href={routePaths.ledgers}
                sx={headerIconButtonSx}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography component="h1" sx={pageTitleSx}>
                  账本设置
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  管理账本信息与成员设置
                </Typography>
              </Box>
              <Box sx={illustrationSx}>
                <AccountDialogIllustrationSlot />
              </Box>
            </Stack>

            {ledger.isCurrent ? (
              <Chip
                color="success"
                icon={<CheckRoundedIcon />}
                label="当前使用中"
                sx={statusChipSx}
              />
            ) : null}
          </Stack>

          <Box
            action={updateLedgerSettingsAction}
            component="form"
            id={ledgerSettingsFormId}
          >
            <input name="intent" type="hidden" value="ledger" />
            <input name="ledgerId" type="hidden" value={ledger.id} />

            <SettingsSection title="基础信息">
              <SoftCard sx={sectionCardSx}>
                <Stack spacing={1.5}>
                  <SettingsField icon={<HomeRoundedIcon />} label="账本名称">
                    <TextField
                      autoComplete="off"
                      defaultValue={ledger.name}
                      disabled={!canEditLedger}
                      fullWidth
                      name="ledgerName"
                      required
                      slotProps={{ htmlInput: { "aria-label": "账本名称" } }}
                    />
                  </SettingsField>

                  <SettingsDivider />

                  <SettingsField
                    icon={<CurrencyYenRoundedIcon />}
                    label="默认货币"
                  >
                    <TextField
                      defaultValue={ledger.baseCurrency}
                      disabled={!canEditLedger}
                      fullWidth
                      name="baseCurrency"
                      required
                      select
                      slotProps={{ htmlInput: { "aria-label": "默认货币" } }}
                    >
                      {ledgerCurrencyOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                      {!ledgerCurrencyOptions.some(
                        (option) => option.value === ledger.baseCurrency,
                      ) ? (
                        <MenuItem value={ledger.baseCurrency}>
                          {ledger.baseCurrency}
                        </MenuItem>
                      ) : null}
                    </TextField>
                  </SettingsField>

                  {!canEditLedger ? (
                    <HelperText>
                      只有管理员或所有者可以修改账本名称与默认货币。
                    </HelperText>
                  ) : null}
                </Stack>
              </SoftCard>
            </SettingsSection>
          </Box>

          <SettingsSection title="成员">
            <SoftCard sx={sectionCardSx}>
              <Stack spacing={1.25}>
                {members.map((member, index) => (
                  <MemberRow
                    isLast={index === members.length - 1}
                    key={member.userId}
                    member={member}
                    onClick={() => setSelectedMember(member)}
                  />
                ))}
                <Box aria-hidden="true" sx={memberNoteDividerSx} />
                <LedgerInviteEntry
                  action={inviteAction}
                  canInvite={canEditLedger}
                  errorKey={inviteErrorKey}
                  errorMessage={inviteErrorMessage}
                  errorOperation={inviteErrorOperation}
                  ledgerId={ledger.id}
                  token={inviteToken}
                />
              </Stack>
            </SoftCard>
          </SettingsSection>

          <Stack direction="row" spacing={1.5} sx={actionBarSx}>
            <Button
              component={Link}
              fullWidth
              href={routePaths.ledgers}
              sx={cancelButtonSx}
              variant="outlined"
            >
              取消
            </Button>
            <Button
              disabled={!canEditLedger}
              form={ledgerSettingsFormId}
              fullWidth
              sx={saveButtonSx}
              type="submit"
              variant="contained"
            >
              保存修改
            </Button>
          </Stack>
        </Stack>

        <MemberSettingsDialog
          canManageMembers={canEditLedger}
          currentUserId={currentUser.userId}
          ledger={ledger}
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          updateLedgerSettingsAction={updateLedgerSettingsAction}
        />

        {errorFeedbacks.map((feedback, index) => (
          <FailureFeedbackDialog
            bottomOffset={errorFeedbackBottomOffset(index)}
            description={feedback.message}
            key={feedback.id}
            onClose={() => closeErrorFeedback(feedback.id)}
            open
            title="账本设置保存失败"
          />
        ))}
        <SuccessFeedbackDialog
          bottomOffset={feedbackBottomOffset}
          description="账本设置已保存。"
          onClose={closeSaveSuccessDialog}
          open={isSaveSuccessOpen}
          title="保存成功"
        />
      </PageShell>
    </>
  );
}

function SettingsSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Stack component="section" spacing={0.9}>
      <Typography component="h2" sx={sectionTitleSx}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

function SettingsField({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1.4} sx={{ alignItems: "center" }}>
      <IconBox>{icon}</IconBox>
      <Stack spacing={0.65} sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="label" sx={fieldLabelSx}>
          {label}
        </Typography>
        {children}
      </Stack>
    </Stack>
  );
}

function IconBox({ children }: { children: ReactNode }) {
  return <Box sx={iconBoxSx}>{children}</Box>;
}

function SettingsDivider() {
  return <Box aria-hidden="true" sx={dividerSx} />;
}

function HelperText({
  children,
  icon = <InfoOutlinedIcon />,
  strong = false,
}: {
  children: ReactNode;
  icon?: ReactNode;
  strong?: boolean;
}) {
  return (
    <Stack direction="row" spacing={0.65} sx={helperTextSx(strong)}>
      <Box sx={helperIconSx}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 500 }}>
        {children}
      </Typography>
    </Stack>
  );
}

function MemberRow({
  isLast,
  member,
  onClick,
}: {
  isLast: boolean;
  member: LedgerSettingsMember;
  onClick: () => void;
}) {
  const colorToken = themeColorTokens[member.displayColor];

  return (
    <Stack spacing={1.15}>
      <ListRowButton
        avatar={
          member.avatarUrl ? (
            <Box
              alt=""
              component="img"
              src={member.avatarUrl}
              sx={memberAvatarImageSx}
            />
          ) : (
            <PersonRoundedIcon />
          )
        }
        avatarSx={memberAvatarSx(colorToken.accent, colorToken.accentSoft)}
        onClick={onClick}
        subtitle={
          member.email ? (
            <Typography color="text.secondary" noWrap variant="body2">
              {member.email}
            </Typography>
          ) : null
        }
        title={member.displayName}
        trailing={
          <>
            <Chip
              label={ledgerRoleLabels[member.role]}
              sx={roleChipSx(member.role)}
            />
            <ChevronRightRoundedIcon sx={memberChevronSx} />
          </>
        }
      />
      {!isLast ? <SettingsDivider /> : null}
    </Stack>
  );
}

function MemberSettingsDialog({
  canManageMembers,
  currentUserId,
  ledger,
  member,
  onClose,
  updateLedgerSettingsAction,
}: {
  canManageMembers: boolean;
  currentUserId: string;
  ledger: LedgerSettingsView["ledger"];
  member: LedgerSettingsMember | null;
  onClose: () => void;
  updateLedgerSettingsAction: ServerAction;
}) {
  if (!member) return null;

  const isSelf = member.userId === currentUserId;
  const canEditProfile = canManageMembers || isSelf;
  const canEditRole = canManageMembers && member.role !== "owner";

  return (
    <AccountFormDialogShell onClose={onClose} open>
      <Stack
        component="form"
        action={updateLedgerSettingsAction}
        key={member.userId}
        spacing={2.2}
      >
        <input name="intent" type="hidden" value="member" />
        <input name="ledgerId" type="hidden" value={ledger.id} />
        {canEditProfile ? (
          <input name="memberUserId" type="hidden" value={member.userId} />
        ) : null}
        {canEditProfile && !canEditRole ? (
          <input name="memberRole" type="hidden" value={member.role} />
        ) : null}

        <Stack direction="row" spacing={1.2} sx={dialogHeaderSx}>
          <Typography component="h2" sx={dialogTitleSx}>
            成员设置
          </Typography>
          <IconButton aria-label="关闭" onClick={onClose} sx={dialogCloseSx}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {!canEditProfile ? (
          <HelperText>普通成员只能修改自己的当前账本昵称和个性色。</HelperText>
        ) : null}

        <SettingsField icon={<PersonRoundedIcon />} label="当前账本昵称">
          <TextField
            autoComplete="off"
            defaultValue={member.displayName}
            disabled={!canEditProfile}
            fullWidth
            name={canEditProfile ? "memberDisplayName" : undefined}
            required={canEditProfile}
            slotProps={{ htmlInput: { "aria-label": "当前账本昵称" } }}
          />
        </SettingsField>

        <SettingsDivider />

        <Stack spacing={1.2}>
          <Stack direction="row" spacing={1.4} sx={{ alignItems: "center" }}>
            <IconBox>
              <PaletteRoundedIcon />
            </IconBox>
            <Stack spacing={0.65} sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="p" sx={fieldLabelSx}>
                当前账本个性色
              </Typography>
              <Stack direction="row" spacing={1.35} sx={colorPickerSx}>
                {getVisibleColorOptions(member.displayColor).map((colorKey) => (
                  <ColorRadio
                    colorKey={colorKey}
                    defaultChecked={colorKey === member.displayColor}
                    disabled={!canEditProfile}
                    key={colorKey}
                    name={canEditProfile ? "memberDisplayColor" : undefined}
                  />
                ))}
              </Stack>
            </Stack>
          </Stack>
          <HelperText icon={<InfoOutlinedIcon />} strong>
            个性色将用于当前账本内的成员标识与记录展示
          </HelperText>
        </Stack>

        <SettingsDivider />

        <SettingsField
          icon={<AdminPanelSettingsRoundedIcon />}
          label="成员权限"
        >
          <TextField
            defaultValue={member.role}
            disabled={!canEditRole}
            fullWidth
            name={canEditRole ? "memberRole" : undefined}
            required={canEditRole}
            select
            slotProps={{ htmlInput: { "aria-label": "成员权限" } }}
          >
            {ledgerRoleOptions.map((option) => (
              <MenuItem
                disabled={option.value === "owner" && member.role !== "owner"}
                key={option.value}
                value={option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </SettingsField>

        {member.role === "owner" && canManageMembers ? (
          <HelperText>所有者权限暂不在这里变更。</HelperText>
        ) : null}

        <Stack direction="row" spacing={1.5} sx={{ pt: 0.4 }}>
          <Button
            fullWidth
            onClick={onClose}
            sx={cancelButtonSx}
            type="button"
            variant="outlined"
          >
            取消
          </Button>
          <Button
            disabled={!canEditProfile}
            fullWidth
            sx={saveButtonSx}
            type="submit"
            variant="contained"
          >
            保存修改
          </Button>
        </Stack>
      </Stack>
    </AccountFormDialogShell>
  );
}

function ColorRadio({
  colorKey,
  defaultChecked,
  disabled = false,
  name,
}: {
  colorKey: ThemeColorKey;
  defaultChecked: boolean;
  disabled?: boolean;
  name?: string;
}) {
  const colorToken = themeColorTokens[colorKey];

  return (
    <Box component="label" sx={colorOptionLabelSx(disabled)}>
      <input
        aria-label={colorToken.label}
        defaultChecked={defaultChecked}
        disabled={disabled}
        name={name}
        style={visuallyHiddenInputStyle}
        type="radio"
        value={colorKey}
      />
      <Box component="span" sx={colorSwatchSx(colorToken.accent)}>
        <CheckRoundedIcon />
      </Box>
    </Box>
  );
}

function getVisibleColorOptions(currentColor: ThemeColorKey) {
  return (ledgerMemberColorOptions as readonly ThemeColorKey[]).includes(
    currentColor,
  )
    ? ledgerMemberColorOptions
    : ([currentColor, ...ledgerMemberColorOptions] as const);
}

const pageBackgroundSx = {
  bgcolor: "background.paper",
  inset: 0,
  position: "fixed",
  zIndex: -1,
};

const pageShellSx = {
  px: { xs: 0.75 },
  py: { xs: 0.75 },
};

const formSx = {
  pb: `calc(${bottomNavigationLayout.shellPaddingBottom} + 24px)`,
};

const headerSx = {
  minHeight: { xs: 112, sm: 124 },
  overflow: "hidden",
  position: "relative",
};

const headerIconButtonSx = {
  color: "text.primary",
  mt: 0.2,
  zIndex: 1,
};

const illustrationSx = {
  pointerEvents: "none",
  position: "absolute",
  right: { xs: -4, sm: 8 },
  top: { xs: -12, sm: -8 },
};

const pageTitleSx = {
  ...typographyStyles.pageTitle,
  fontSize: { xs: 28, sm: 30 },
  fontWeight: 900,
  pr: 14,
};

const statusChipSx = {
  ...typographyStyles.chipBadge,
  alignSelf: "flex-start",
  bgcolor: "var(--user-theme-business-completed-bg)",
  color: "var(--user-theme-business-completed-text)",
  fontSize: 14,
  fontWeight: 800,
  height: 34,
  px: 0.6,
  "& .MuiChip-icon": {
    color: "inherit",
    fontSize: 20,
  },
};

const sectionTitleSx = {
  ...typographyStyles.cardTitle,
  fontSize: { xs: 18, sm: 19 },
  fontWeight: 900,
  px: 0.35,
};

const sectionCardSx = {
  borderRadius: 2,
  p: { xs: 1.5, sm: 1.75 },
};

const iconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 46,
  justifyContent: "center",
  width: 46,
  "& .MuiSvgIcon-root": {
    fontSize: 26,
  },
};

const fieldLabelSx = {
  color: "text.secondary",
  fontSize: 14,
  fontWeight: 700,
};

const dividerSx = {
  borderTop: "1px solid",
  borderColor: "divider",
  ml: 7.35,
};

const memberNoteDividerSx = {
  borderTop: "1px solid",
  borderColor: "divider",
  ml: 7.35,
};

function helperTextSx(strong: boolean) {
  return {
    alignItems: "center",
    color: strong ? "var(--user-theme-action-text)" : "text.secondary",
    px: 0.4,
  } as const;
}

const helperIconSx = {
  alignItems: "center",
  color: "var(--user-theme-action-text)",
  display: "inline-flex",
  flexShrink: 0,
  "& .MuiSvgIcon-root": {
    fontSize: 18,
  },
};

function memberAvatarSx(accent: string, accentSoft: string) {
  return {
    alignItems: "center",
    bgcolor: accentSoft,
    border: "1px solid",
    borderColor: accent,
    borderRadius: "50%",
    color: accent,
    display: "inline-flex",
    flexShrink: 0,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
    "& .MuiSvgIcon-root": {
      fontSize: 26,
    },
  } as const;
}

const memberAvatarImageSx = {
  display: "block",
  height: "100%",
  objectFit: "cover",
  width: "100%",
};

function roleChipSx(role: LedgerSettingsMember["role"]) {
  const isAdmin = role === "owner" || role === "admin";

  return {
    ...typographyStyles.chipBadge,
    bgcolor: isAdmin
      ? "var(--user-theme-business-completed-bg)"
      : "action.hover",
    color: isAdmin
      ? "var(--user-theme-business-completed-text)"
      : "text.secondary",
    flexShrink: 0,
    fontWeight: 800,
  } as const;
}

const memberChevronSx = {
  color: "text.secondary",
  flexShrink: 0,
  fontSize: 24,
};

const dialogHeaderSx = {
  alignItems: "center",
  minHeight: 42,
};

const dialogTitleSx = {
  ...typographyStyles.pageTitle,
  flex: 1,
  fontSize: 25,
  fontWeight: 900,
};

const dialogCloseSx = {
  color: "text.secondary",
};

const colorPickerSx = {
  alignItems: "center",
  flexWrap: "wrap",
  pl: { xs: 0.2, sm: 0.4 },
};

function colorOptionLabelSx(disabled: boolean) {
  return {
    cursor: disabled ? "default" : "pointer",
    display: "inline-flex",
    opacity: disabled ? 0.55 : 1,
    position: "relative",
    "& input:checked + span": {
      borderColor: "var(--user-theme-action-text)",
      boxShadow: "0 0 0 3px rgba(233, 161, 58, 0.18)",
      transform: "scale(1.06)",
    },
    "& input:checked + span .MuiSvgIcon-root": {
      opacity: 1,
    },
  } as const;
}

const visuallyHiddenInputStyle = {
  height: 1,
  opacity: 0,
  position: "absolute",
  width: 1,
} as const;

function colorSwatchSx(accent: string) {
  return {
    alignItems: "center",
    bgcolor: accent,
    border: "3px solid",
    borderColor: "transparent",
    borderRadius: "50%",
    color: "common.white",
    display: "inline-flex",
    height: 42,
    justifyContent: "center",
    transition: "transform 160ms ease, box-shadow 160ms ease",
    width: 42,
    "& .MuiSvgIcon-root": {
      fontSize: 23,
      opacity: 0,
    },
  } as const;
}

const actionBarSx = {
  bgcolor: "background.paper",
  bottom: 0,
  left: 0,
  mx: { xs: -0.75 },
  px: { xs: 1.5, sm: 2 },
  py: { xs: 1.2, sm: 1.4 },
  position: "sticky",
  zIndex: 1,
};

const cancelButtonSx = {
  borderColor: "var(--user-theme-action-text)",
  borderRadius: 999,
  color: "text.secondary",
  fontWeight: 900,
  minHeight: 48,
};

const saveButtonSx = {
  background: "var(--user-theme-fab-bg)",
  borderRadius: 999,
  color: "var(--user-theme-fab-text)",
  fontWeight: 900,
  minHeight: 48,
  "&:hover": {
    background: "var(--user-theme-fab-bg)",
    filter: "brightness(1.04)",
  },
};

const feedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

function errorFeedbackBottomOffset(index: number) {
  return `calc(${feedbackBottomOffset} + ${index * 88}px)`;
}
