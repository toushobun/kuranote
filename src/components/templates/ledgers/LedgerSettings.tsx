"use client";

import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CurrencyYenRoundedIcon from "@mui/icons-material/CurrencyYenRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import { alpha } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { PrimaryActionButton } from "atoms/ui/PrimaryActionButton/PrimaryActionButton";
import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerDeletionMessages } from "config/ledgerDeletionMessages";
import { ledgerSettingsPageMessages } from "config/ledgerMessages";
import { routePaths } from "config/paths";
import { ListRowButton } from "molecules/ui/ListRowButton";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import {
  BackLayerScope,
  useSelectBackLayer,
} from "molecules/ui/UnsavedChangesDialog/BackLayerScope";
import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "molecules/ui/UnsavedChangesDialog/useUnsavedChangesGuard";
import { AccountFormDialogShell } from "organisms/accounts/AccountFormDialogShell/AccountFormDialogShell";
import { LedgerDeletion } from "organisms/ledgers/LedgerDeletion/LedgerDeletion";
import type { DeleteLedgerAction } from "organisms/ledgers/LedgerDeletion/useLedgerDeletion";
import { LedgerInviteEntry } from "organisms/ledgers/LedgerInviteEntry/LedgerInviteEntry";
import { LedgerMultiAccountPaymentSetting } from "organisms/ledgers/LedgerMultiAccountPaymentSetting/LedgerMultiAccountPaymentSetting";
import { LedgerSpecialStatusSetting } from "organisms/ledgers/LedgerSpecialStatusSetting/LedgerSpecialStatusSetting";
import {
  bottomNavigationLayout,
  stackedFeedbackBottomOffset,
} from "organisms/navigation/bottomNavigationLayout";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import { useClearQueryParam } from "templates/useClearQueryParam";
import { designTokens } from "theme/theme";
import { themeColorTokens, type ThemeColorKey } from "theme/themeColorTokens";
import { typographyStyles } from "theme/typographyTokens";
import {
  ledgerCurrencyOptions,
  ledgerMemberColorOptions,
  ledgerRoleLabels,
  ledgerRoleOptions,
  type LedgerInviteStateAction,
  type LedgerPlaceholderMemberActions,
  type LedgerSettingsActionState,
  type LedgerSettingsMember,
  type LedgerSettingsView,
  type LoadLedgerDeletionImpactAction,
} from "types/ledgers";

type SettingsAction = (
  data: FormData,
) => Promise<LedgerSettingsActionState | void>;

function useSettingsForm({
  fields,
  action,
  onSaved,
  onClose,
}: {
  fields: Record<string, string>;
  action: SettingsAction;
  onSaved: () => void;
  onClose?: () => void;
}) {
  const formId = useId();
  const [baseline, setBaseline] = useState(() => Object.values(fields));
  const [pending, setPending] = useState(false);
  const [completion, setCompletion] = useState<{ success: boolean } | null>(
    null,
  );
  const guard = useUnsavedChangesGuard({
    isDirty: Object.values(fields).some(
      (value, index) => value !== baseline[index],
    ),
    saveFormId: formId,
    layer: onClose ? 0 : null,
    onClose,
  });

  const finishSave = useEffectEvent((success: boolean) => {
    void guard.completeSave(success, formId).then((handled) => {
      if (success && !handled) onSaved();
    });
  });
  useEffect(() => {
    if (!completion) return;
    // 等 Next 提交同页刷新与新基线，再执行确认框记录的导航。
    finishSave(completion.success);
  }, [completion]);

  async function submit(data: FormData) {
    if (pending) return;
    const submitted = Object.keys(fields).map((field) =>
      String(data.get(field) ?? fields[field]),
    );
    setPending(true);
    try {
      const result = await guard.runInPlaceAction(() => action(data));
      startTransition(() => {
        if (result?.success) setBaseline(submitted);
        setCompletion({ success: Boolean(result?.success) });
        setPending(false);
      });
    } catch (error) {
      void guard.completeSave(false, formId);
      setPending(false);
      throw error;
    }
  }

  return { formId, guard, pending, submit };
}

export type LedgerSettingsSaveResult = "updated";

type ErrorFeedback = {
  id: string;
  message: string;
};

type LedgerSettingsTemplateProps = LedgerSettingsView & {
  deleteLedgerAction?: DeleteLedgerAction;
  loadDeletionImpactAction?: LoadLedgerDeletionImpactAction;
  errorKey?: string | null;
  errorMessage: string | null;
  inviteAction: LedgerInviteStateAction;
  inviteToken?: string | null;
  /** 只有 owner/admin 会传入；其他成员只读占位摘要。 */
  placeholderMemberActions?: LedgerPlaceholderMemberActions | null;
  saveResult?: LedgerSettingsSaveResult | null;
  updateLedgerSettingsAction: SettingsAction;
};

export function LedgerSettingsTemplate(props: LedgerSettingsTemplateProps) {
  return (
    <BackLayerScope level={0}>
      <LedgerSettingsContent {...props} />
    </BackLayerScope>
  );
}

function LedgerSettingsContent({
  canEditLedger,
  deleteLedgerAction,
  loadDeletionImpactAction,
  currentUser,
  errorKey = null,
  errorMessage,
  inviteAction,
  inviteToken = null,
  ledger,
  members,
  placeholderMemberActions = null,
  placeholderMembers,
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
  const [ledgerName, setLedgerName] = useState(ledger.name);
  const [baseCurrency, setBaseCurrency] = useState(ledger.baseCurrency);
  const [specialStatusEnabled, setSpecialStatusEnabled] = useState(
    ledger.transactionItemSpecialStatusEnabled ?? false,
  );
  const [multiAccountPaymentEnabled, setMultiAccountPaymentEnabled] = useState(
    ledger.multiAccountPaymentEnabled ?? false,
  );
  const currencyMenu = useSelectBackLayer(1);
  const form = useSettingsForm({
    fields: {
      ledgerName,
      baseCurrency,
      transactionItemSpecialStatusEnabled: String(specialStatusEnabled),
      multiAccountPaymentEnabled: String(multiAccountPaymentEnabled),
    },
    action: updateLedgerSettingsAction,
    onSaved: () => setIsSaveSuccessOpen(true),
  });
  const enqueuedErrorKeysRef = useRef(new Set<string>());
  const errorFeedbackIdRef = useRef(0);
  const clearResultParam = useClearQueryParam("result");

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
  }

  function closeSaveSuccessDialog() {
    setIsSaveSuccessOpen(false);

    if (saveResult !== null) clearResultParam();
  }

  return (
    <SettingsPageLayout
      back={{
        href: routePaths.ledgers,
        label: ledgerSettingsPageMessages.backToLedgers,
      }}
      subtitle={ledgerSettingsPageMessages.subtitle}
      title={ledgerSettingsPageMessages.title}
    >
      <Stack
        component="form"
        action={form.submit}
        id={form.formId}
        spacing={1.45}
        sx={formSx}
      >
        <input name="intent" type="hidden" value="ledger" />
        <input name="ledgerId" type="hidden" value={ledger.id} />

        {ledger.isCurrent ? (
          <Chip
            color="success"
            icon={<CheckRoundedIcon />}
            label="当前使用中"
            sx={statusChipSx}
          />
        ) : null}

        <SettingsSection title="基础信息">
          <SoftCard sx={sectionCardSx}>
            <Stack spacing={1.5}>
              <SettingsField icon={<HomeRoundedIcon />} label="账本名称">
                <TextField
                  autoComplete="off"
                  disabled={!canEditLedger || form.pending}
                  fullWidth
                  name="ledgerName"
                  onChange={(event) => setLedgerName(event.target.value)}
                  required
                  slotProps={{ htmlInput: { "aria-label": "账本名称" } }}
                  value={ledgerName}
                />
              </SettingsField>

              <SettingsDivider />

              <SettingsField icon={<CurrencyYenRoundedIcon />} label="默认货币">
                <TextField
                  disabled={!canEditLedger || form.pending}
                  fullWidth
                  name="baseCurrency"
                  onChange={(event) => setBaseCurrency(event.target.value)}
                  required
                  select
                  slotProps={{
                    htmlInput: { "aria-label": "默认货币" },
                    select: currencyMenu,
                  }}
                  value={baseCurrency}
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

        <input
          name="transactionItemSpecialStatusEnabled"
          type="hidden"
          value={String(specialStatusEnabled)}
        />
        <LedgerSpecialStatusSetting
          canEdit={canEditLedger && !form.pending}
          enabled={specialStatusEnabled}
          onChange={setSpecialStatusEnabled}
        />

        <input
          name="multiAccountPaymentEnabled"
          type="hidden"
          value={String(multiAccountPaymentEnabled)}
        />
        <LedgerMultiAccountPaymentSetting
          canEdit={canEditLedger && !form.pending}
          enabled={multiAccountPaymentEnabled}
          onChange={setMultiAccountPaymentEnabled}
        />

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
                ledgerId={ledger.id}
                ledgerName={ledger.name}
                placeholderMemberActions={placeholderMemberActions}
                placeholderMembers={placeholderMembers}
                token={inviteToken}
              />
            </Stack>
          </SoftCard>
        </SettingsSection>

        {ledger.currentUserRole === "owner" &&
        deleteLedgerAction &&
        loadDeletionImpactAction ? (
          <SettingsSection title={ledgerDeletionMessages.section} danger>
            <SoftCard
              sx={{
                ...sectionCardSx,
                border: "1px solid",
                borderColor: "error.light",
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
              }}
            >
              <LedgerDeletion
                ledger={ledger}
                action={deleteLedgerAction}
                loadImpact={loadDeletionImpactAction}
              />
            </SoftCard>
          </SettingsSection>
        ) : null}

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
          <PrimaryActionButton
            disabled={!canEditLedger || form.pending}
            fullWidth
            type="submit"
          >
            保存修改
          </PrimaryActionButton>
        </Stack>
      </Stack>

      <MemberSettingsDialog
        canManageMembers={canEditLedger}
        currentUserId={currentUser.userId}
        ledger={ledger}
        member={selectedMember}
        onSaved={() => setIsSaveSuccessOpen(true)}
        onClose={() => setSelectedMember(null)}
        updateLedgerSettingsAction={updateLedgerSettingsAction}
      />

      <UnsavedChangesDialog {...form.guard.dialogProps} />
      {errorFeedbacks.map((feedback, index) => (
        <FailureFeedbackDialog
          aboveModal
          bottomOffset={stackedFeedbackBottomOffset(index)}
          description={feedback.message}
          key={feedback.id}
          onClose={() => closeErrorFeedback(feedback.id)}
          open
          title="账本设置保存失败"
        />
      ))}
      <SuccessFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        description={ledgerSettingsPageMessages.saved}
        onClose={closeSaveSuccessDialog}
        open={isSaveSuccessOpen}
        title="保存成功"
      />
    </SettingsPageLayout>
  );
}

function SettingsSection({
  children,
  title,
  danger = false,
}: {
  children: ReactNode;
  title: string;
  danger?: boolean;
}) {
  return (
    <Stack component="section" spacing={0.9}>
      <Typography
        component="h2"
        sx={{
          ...sectionTitleSx,
          ...(danger
            ? {
                color: "error.main",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }
            : {}),
        }}
      >
        {danger && <WarningRoundedIcon />}
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
            <Typography color="textSecondary" noWrap variant="body2">
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
  onSaved,
  updateLedgerSettingsAction,
}: {
  canManageMembers: boolean;
  currentUserId: string;
  ledger: LedgerSettingsView["ledger"];
  member: LedgerSettingsMember | null;
  onClose: () => void;
  onSaved: () => void;
  updateLedgerSettingsAction: SettingsAction;
}) {
  if (!member) return null;

  return (
    <MemberSettingsDialogContent
      canManageMembers={canManageMembers}
      currentUserId={currentUserId}
      key={member.userId}
      ledger={ledger}
      member={member}
      onClose={onClose}
      onSaved={onSaved}
      updateLedgerSettingsAction={updateLedgerSettingsAction}
    />
  );
}

function MemberSettingsDialogContent({
  canManageMembers,
  currentUserId,
  ledger,
  member,
  onClose,
  onSaved,
  updateLedgerSettingsAction,
}: {
  canManageMembers: boolean;
  currentUserId: string;
  ledger: LedgerSettingsView["ledger"];
  member: LedgerSettingsMember;
  onClose: () => void;
  onSaved: () => void;
  updateLedgerSettingsAction: SettingsAction;
}) {
  const [displayName, setDisplayName] = useState(member.displayName);
  const [displayColor, setDisplayColor] = useState(member.displayColor);
  const [role, setRole] = useState(member.role);
  const roleMenu = useSelectBackLayer(1);

  const isSelf = member.userId === currentUserId;
  const canEditProfile = canManageMembers || isSelf;
  const canEditRole = canManageMembers && member.role !== "owner";

  const form = useSettingsForm({
    fields: {
      memberDisplayName: displayName,
      memberDisplayColor: displayColor,
      memberRole: role,
    },
    action: updateLedgerSettingsAction,
    onClose,
    onSaved: () => {
      onClose();
      onSaved();
    },
  });

  return (
    <AccountFormDialogShell onClose={form.guard.requestClose} open>
      <Stack
        component="form"
        action={form.submit}
        id={form.formId}
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
          <IconButton
            aria-label="关闭"
            onClick={form.guard.requestClose}
            sx={dialogCloseSx}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {!canEditProfile ? (
          <HelperText>普通成员只能修改自己的当前账本昵称和个性色。</HelperText>
        ) : null}

        <SettingsField icon={<PersonRoundedIcon />} label="当前账本昵称">
          <TextField
            autoComplete="off"
            disabled={!canEditProfile || form.pending}
            fullWidth
            name={canEditProfile ? "memberDisplayName" : undefined}
            onChange={(event) => setDisplayName(event.target.value)}
            required={canEditProfile}
            slotProps={{ htmlInput: { "aria-label": "当前账本昵称" } }}
            value={displayName}
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
              {canEditProfile ? (
                <input
                  name="memberDisplayColor"
                  type="hidden"
                  value={displayColor}
                />
              ) : null}
              <Stack
                aria-label="当前账本个性色"
                direction="row"
                role="radiogroup"
                spacing={1.35}
                sx={colorPickerSx}
              >
                {getVisibleColorOptions(member.displayColor).map((colorKey) => (
                  <ColorRadio
                    checked={colorKey === displayColor}
                    colorKey={colorKey}
                    disabled={!canEditProfile || form.pending}
                    key={colorKey}
                    onChange={setDisplayColor}
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
            disabled={!canEditRole || form.pending}
            fullWidth
            name={canEditRole ? "memberRole" : undefined}
            onChange={(event) =>
              setRole(event.target.value as LedgerSettingsMember["role"])
            }
            required={canEditRole}
            select
            slotProps={{
              htmlInput: { "aria-label": "成员权限" },
              select: roleMenu,
            }}
            value={role}
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
            onClick={form.guard.requestClose}
            sx={cancelButtonSx}
            type="button"
            variant="outlined"
          >
            取消
          </Button>
          <PrimaryActionButton
            disabled={!canEditProfile || form.pending}
            fullWidth
            type="submit"
          >
            保存修改
          </PrimaryActionButton>
        </Stack>
      </Stack>
      <UnsavedChangesDialog {...form.guard.dialogProps} />
    </AccountFormDialogShell>
  );
}

function ColorRadio({
  checked,
  colorKey,
  disabled = false,
  onChange,
}: {
  checked: boolean;
  colorKey: ThemeColorKey;
  disabled?: boolean;
  onChange: (colorKey: ThemeColorKey) => void;
}) {
  const colorToken = themeColorTokens[colorKey];

  return (
    <Box component="label" sx={colorOptionLabelSx(disabled)}>
      <input
        aria-label={colorToken.label}
        checked={checked}
        disabled={disabled}
        form=""
        name="memberDisplayColorOption"
        onChange={() => onChange(colorKey)}
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

const formSx = {
  pb: `calc(${bottomNavigationLayout.shellPaddingBottom} + 24px)`,
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
  borderRadius: `${designTokens.radius.lg}px`,
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
  borderRadius: `${designTokens.radius.full}px`,
  color: "text.secondary",
  fontWeight: 900,
  minHeight: 48,
};
