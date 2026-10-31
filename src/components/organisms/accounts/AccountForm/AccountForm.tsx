"use client";

import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { accountFormMessages } from "config/accountMessages";
import { routePaths } from "config/paths";
import { AccountCard } from "molecules/accounts/AccountCard";
import { AccountHolderAvatarPicker } from "molecules/accounts/AccountHolderAvatarPicker/AccountHolderAvatarPicker";
import { AccountTypePicker } from "molecules/accounts/AccountTypePicker/AccountTypePicker";
import { PageFormActions } from "molecules/ui/PageFormActions/PageFormActions";
import { SectionCard } from "molecules/ui/SectionCard";
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type {
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";
import { getAccountCurrencyOptions } from "utils/accounts";
import { getCurrencySymbol } from "utils/currency";

import { useAccountForm } from "./useAccountForm";

type AccountFormProps = {
  action: ServerAction;
  defaultCurrency: string;
  holderOptions: AccountHolderOption[];
  pending?: boolean;
  placeholderHolderOptions?: AccountPlaceholderHolderOption[];
  // 新增成功或取消后返回的站内路径（例如记一笔），由服务端再次校验。
  returnTo?: string | null;
};

/** 新增账户页面的表单：顶部实时预览列表中的账户卡片，下方按基本信息、金额、持有人分组填写。 */
export function AccountForm({
  action,
  defaultCurrency,
  holderOptions,
  pending = false,
  placeholderHolderOptions = [],
  returnTo = null,
}: AccountFormProps) {
  const form = useAccountForm({
    defaultCurrency,
    holderOptions,
    placeholderHolderOptions,
  });

  return (
    <Stack component="form" action={action} spacing={2}>
      {returnTo ? (
        <input name="returnTo" readOnly type="hidden" value={returnTo} />
      ) : null}

      <Stack spacing={1}>
        <Typography sx={previewLabelSx}>
          {accountFormMessages.previewLabel}
        </Typography>
        <Box data-testid="account-form-preview" sx={previewFrameSx}>
          <AccountCard
            currency={form.currency}
            currentBalance={form.preview.balance}
            holders={form.preview.holders}
            name={
              form.name.trim() || accountFormMessages.previewNamePlaceholder
            }
            type={form.type}
          />
        </Box>
      </Stack>

      <AccountFormSection title={accountFormMessages.basicSection}>
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
        <AccountTypePicker
          name="type"
          onChange={form.setType}
          value={form.type}
        />
      </AccountFormSection>

      <AccountFormSection title={accountFormMessages.amountSection}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5}>
            <TextField
              label={accountFormMessages.currencyLabel}
              name="currency"
              onChange={(event) => form.setCurrency(event.target.value)}
              required
              select
              sx={{ flex: "0 0 38%", minWidth: 0 }}
              value={form.currency}
            >
              {getAccountCurrencyOptions(defaultCurrency).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label={accountFormMessages.initialBalanceLabel}
              name="initialBalance"
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
          <Typography color="textSecondary" variant="body2">
            {accountFormMessages.initialBalanceHelper}
          </Typography>
        </Stack>
      </AccountFormSection>

      <AccountFormSection
        description={accountFormMessages.holderHelper}
        title={accountFormMessages.holderSection}
      >
        <AccountHolderAvatarPicker
          holderOptions={holderOptions}
          onChange={form.setHolderSelection}
          placeholderOptions={placeholderHolderOptions}
          selection={form.holderSelection}
        />
      </AccountFormSection>

      <PageFormActions
        cancelHref={returnTo ?? routePaths.accounts}
        cancelLabel={accountFormMessages.cancel}
        pending={pending}
        pendingLabel={accountFormMessages.saving}
        submitLabel={accountFormMessages.save}
      />
    </Stack>
  );
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

const previewLabelSx = {
  color: "text.secondary",
  fontSize: 14,
  fontWeight: 700,
  px: 0.5,
};

const previewFrameSx = {
  border: "2px dashed",
  borderColor: "var(--user-theme-action-text)",
  borderRadius: `${designTokens.radius.lg}px`,
  p: 0.5,
};

const sectionTitleSx = {
  fontSize: 18,
  fontWeight: 800,
};
