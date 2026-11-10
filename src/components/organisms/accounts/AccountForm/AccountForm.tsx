"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { AccountAvatar } from "atoms/accounts/AccountAvatar/AccountAvatar";
import { WebsiteIconField } from "molecules/ui/WebsiteIconField/WebsiteIconField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, type ReactNode } from "react";

import {
  accountFormMessages,
  accountIconMessages,
} from "config/accountMessages";
import { balanceAdjustmentText } from "config/balanceAdjustmentText";
import { routePaths } from "config/paths";
import { accountErrorCodes, accountErrorMessages } from "internal/account";
import { AccountHolderAvatarPicker } from "molecules/accounts/AccountHolderAvatarPicker/AccountHolderAvatarPicker";
import { AccountTypePicker } from "molecules/accounts/AccountTypePicker/AccountTypePicker";
import { PageFormActions } from "molecules/ui/PageFormActions/PageFormActions";
import { SectionCard } from "molecules/ui/SectionCard";
import type { ServerAction, WebsiteIconStateAction } from "types/actions";
import type {
  Account,
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";
import { getAccountCurrencyOptions } from "utils/accounts";
import { getCurrencySymbol } from "utils/currency";
import { formatNumber } from "utils/transactions";

import { useAccountForm } from "./useAccountForm";

type AccountFormProps = {
  /** 编辑的账户；不传时为新增。 */
  account?: Account | null;
  action: ServerAction;
  fetchIconAction?: WebsiteIconStateAction;
  defaultCurrency: string;
  holderOptions: AccountHolderOption[];
  /** 页面在离开确认里点「保存」时按这个 id 提交表单。 */
  id?: string;
  /** 输入与初始值是否不同；改回原值后为 false，但守卫已记为动过，离开仍需确认。 */
  onDirtyChange?: (dirty: boolean) => void;
  onCancel?: () => void;
  pending?: boolean;
  placeholderHolderOptions?: AccountPlaceholderHolderOption[];
  // 新增成功或取消后返回的站内路径（例如记一笔），由服务端再次校验。
  returnTo?: string | null;
};

/**
 * 新增 / 编辑账户页面的表单：按基本信息、金额、持有人分组填写。
 * 编辑时金额为当前余额，改动后由服务端记一笔余额调整；已有交易的账户不能改币种。
 */
export function AccountForm({
  account = null,
  action,
  fetchIconAction,
  defaultCurrency,
  holderOptions,
  id,
  onDirtyChange,
  onCancel,
  pending = false,
  placeholderHolderOptions = [],
  returnTo = null,
}: AccountFormProps) {
  const form = useAccountForm({
    account,
    fetchIconAction,
    defaultCurrency,
    holderOptions,
    placeholderHolderOptions,
  });
  const adjustment = form.balanceAdjustment;
  useEffect(() => {
    onDirtyChange?.(form.isDirty);
  }, [form.isDirty, onDirtyChange]);
  // 编辑时以账户自己的币种求候选：不在常见清单里的币种（例如导入的账户）也要能显示。
  const currencyOptions = getAccountCurrencyOptions(
    account?.currency ?? defaultCurrency,
  );
  // 已有交易（含初始余额）的账户不能改币种（#910），服务端仍会再次校验。
  const currencyLocked = account?.has_transactions ?? false;
  // 编辑时余额没变就不提交目标余额，避免记一笔 0 元调整。
  const balanceFieldName = account
    ? adjustment?.delta !== 0
      ? "targetBalance"
      : undefined
    : "initialBalance";
  const amountHelper = getAmountHelper({
    adjustment,
    currency: form.currency,
    isEdit: account !== null,
  });

  return (
    <Stack
      component="form"
      action={action}
      id={id}
      onSubmit={(event) => {
        // 无效余额不会作为 targetBalance 提交；保存按钮之外的入口（例如离开确认里的「保存并退出」）
        // 也在这里拦下，避免只保存其他字段、静默丢掉输入的余额。
        if (adjustment && !adjustment.valid) event.preventDefault();
      }}
      spacing={2}
    >
      {account ? (
        <input name="accountId" readOnly type="hidden" value={account.id} />
      ) : null}
      {returnTo ? (
        <input name="returnTo" readOnly type="hidden" value={returnTo} />
      ) : null}

      <AccountFormSection title={accountFormMessages.basicSection}>
        {fetchIconAction ? (
          <>
            <input
              name="previewIconUrl"
              readOnly
              type="hidden"
              value={form.iconUrl}
            />
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Box sx={{ display: "inline-flex", position: "relative" }}>
                <AccountAvatar
                  key={form.iconStatus === "loading" ? "loading" : form.iconUrl}
                  id={account?.id ?? "new-account"}
                  name={form.name}
                  size={64}
                  iconUrl={
                    form.iconStatus === "loading" ? undefined : form.iconUrl
                  }
                />
                {form.iconStatus === "loading" ? (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "action.hover",
                      borderRadius: "inherit",
                    }}
                  >
                    <CircularProgress size={24} aria-hidden />
                  </Box>
                ) : null}
              </Box>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Typography
                  role="status"
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    color: {
                      idle: "text.secondary",
                      loading: "text.secondary",
                      success: "success.main",
                      error: "error.main",
                    }[form.iconStatus],
                  }}
                >
                  {accountIconMessages[form.iconStatus]}
                </Typography>
                {form.iconStatus === "success" ||
                form.iconStatus === "error" ? (
                  <Typography color="textSecondary" variant="body2">
                    {form.iconStatus === "success"
                      ? accountIconMessages.successHelper
                      : (form.iconError ?? accountIconMessages.errorHelper)}
                  </Typography>
                ) : null}
                {form.iconUrl ? (
                  <Button
                    onClick={form.clearIcon}
                    size="small"
                    sx={{ alignSelf: "start", p: 0 }}
                    type="button"
                  >
                    {accountIconMessages.clear}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </>
        ) : null}
        <TextField
          autoComplete="off"
          fullWidth
          label={accountFormMessages.nameLabel}
          name="name"
          onChange={(event) => form.setName(event.target.value)}
          placeholder={accountFormMessages.namePlaceholder}
          required
          value={form.name}
        />
        {fetchIconAction ? (
          <Stack spacing={0.5}>
            <WebsiteIconField
              label={accountIconMessages.websiteLabel}
              buttonLabel={accountIconMessages.fetch}
              loading={form.iconStatus === "loading"}
              onClick={form.fetchIcon}
              onWebsiteUrlChange={form.changeWebsiteUrl}
              websiteUrl={form.websiteUrl}
            />
            <Typography color="textSecondary" variant="body2">
              {accountIconMessages.websiteHelper}
            </Typography>
          </Stack>
        ) : null}
        <AccountTypePicker
          name="type"
          onChange={form.setType}
          value={form.type}
        />
      </AccountFormSection>

      <AccountFormSection title={accountFormMessages.amountSection}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5}>
            {currencyLocked ? (
              // 禁用的字段不会随表单提交，用隐藏字段原样带回当前币种。
              <input
                name="currency"
                readOnly
                type="hidden"
                value={form.currency}
              />
            ) : null}
            <TextField
              disabled={currencyLocked}
              label={accountFormMessages.currencyLabel}
              name={currencyLocked ? undefined : "currency"}
              onChange={(event) => form.setCurrency(event.target.value)}
              required
              select
              sx={{ flex: "0 0 38%", minWidth: 0 }}
              value={form.currency}
            >
              {currencyOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              error={adjustment ? !adjustment.valid : false}
              fullWidth
              label={
                account
                  ? accountFormMessages.currentBalanceLabel
                  : accountFormMessages.initialBalanceLabel
              }
              name={balanceFieldName}
              onChange={(event) => form.setBalance(event.target.value)}
              slotProps={{
                htmlInput: {
                  // 信用卡欠款等需要负数，金额键盘只对这里开放负数。
                  "data-amount-allow-negative": "true",
                  "data-amount-currency": form.currency,
                  "data-amount-input": "true",
                  inputMode: "decimal",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {getCurrencySymbol(form.currency)}
                    </InputAdornment>
                  ),
                },
              }}
              type="text"
              value={form.balance}
            />
          </Stack>
          <Typography
            sx={{
              color: amountHelper.color,
              fontWeight: amountHelper.emphasized ? 700 : 400,
            }}
            variant="body2"
          >
            {amountHelper.text}
          </Typography>
          {currencyLocked ? (
            <Typography color="textSecondary" variant="body2">
              {accountErrorMessages[accountErrorCodes.currencyLocked]}
            </Typography>
          ) : null}
          {adjustment && adjustment.delta !== 0 ? (
            <TextField
              fullWidth
              label={balanceAdjustmentText.noteLabel}
              multiline
              name="balanceAdjustmentNote"
              onChange={(event) =>
                form.setBalanceAdjustmentNote(event.target.value)
              }
              slotProps={{ htmlInput: { maxLength: 2000 } }}
              value={form.balanceAdjustmentNote}
            />
          ) : null}
        </Stack>
      </AccountFormSection>

      <AccountFormSection
        description={
          form.preservedHolderOptions.length > 0
            ? `${accountFormMessages.holderHelper}。${accountFormMessages.preservedHolderHelper}`
            : accountFormMessages.holderHelper
        }
        title={accountFormMessages.holderSection}
      >
        <AccountHolderAvatarPicker
          holderOptions={holderOptions}
          onChange={form.setHolderSelection}
          placeholderOptions={form.placeholderOptions}
          preservedHolderOptions={form.preservedHolderOptions}
          selection={form.holderSelection}
        />
      </AccountFormSection>

      <PageFormActions
        {...(onCancel
          ? { onCancel }
          : { cancelHref: returnTo ?? routePaths.accounts })}
        cancelLabel={accountFormMessages.cancel}
        pending={pending}
        pendingLabel={accountFormMessages.saving}
        submitDisabled={adjustment ? !adjustment.valid : false}
        submitLabel={
          account ? accountFormMessages.saveChanges : accountFormMessages.save
        }
      />
    </Stack>
  );
}

function getAmountHelper({
  adjustment,
  currency,
  isEdit,
}: {
  adjustment: { delta: number; valid: boolean } | null;
  currency: string;
  isEdit: boolean;
}): { color: string; emphasized: boolean; text: string } {
  if (adjustment && !adjustment.valid) {
    return {
      color: "error.main",
      emphasized: false,
      text: balanceAdjustmentText.invalidBalance,
    };
  }
  if (adjustment && adjustment.delta !== 0) {
    const direction =
      adjustment.delta > 0
        ? balanceAdjustmentText.increase
        : balanceAdjustmentText.decrease;
    return {
      color: adjustment.delta > 0 ? "success.main" : "error.main",
      emphasized: true,
      text: `${direction} ${getCurrencySymbol(currency)}${formatNumber(String(Math.abs(adjustment.delta)), currency)}`,
    };
  }

  return {
    color: "text.secondary",
    emphasized: false,
    text: isEdit
      ? accountFormMessages.currentBalanceHelper
      : accountFormMessages.initialBalanceHelper,
  };
}

function AccountFormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography component="h2" sx={sectionTitleSx}>
            {title}
          </Typography>
          {description ? (
            <Typography color="textSecondary" variant="body2">
              {description}
            </Typography>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </SectionCard>
  );
}

const sectionTitleSx = {
  fontSize: 18,
  fontWeight: 800,
};
