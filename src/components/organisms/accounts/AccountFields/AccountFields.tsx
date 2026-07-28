"use client";

import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import { AccountHolderCheckboxGroup } from "molecules/accounts/AccountHolderCheckboxGroup";
import { accountTypeOptions, type AccountHolderOption } from "types/accounts";

const commonCurrencyOptions = [
  { label: "CNY 人民币", value: "CNY" },
  { label: "JPY 日元", value: "JPY" },
  { label: "USD 美元", value: "USD" },
  { label: "EUR 欧元", value: "EUR" },
  { label: "GBP 英镑", value: "GBP" },
  { label: "KRW 韩元", value: "KRW" },
  { label: "THB 泰铢", value: "THB" },
] as const;

type AccountFieldsProps = {
  balanceLabel: string;
  defaultCurrency: string;
  defaultName?: string;
  defaultType: string;
  holderOptions: AccountHolderOption[];
  nameId: string;
  namePlaceholder?: string;
  preservedHolderOptions?: AccountHolderOption[];
  renderBalanceField: (selectedCurrency: string) => ReactNode;
  selectedHolderUserIds?: string[];
  typePlaceholder?: string;
};

export function AccountFields({
  balanceLabel,
  defaultCurrency,
  defaultName,
  defaultType,
  holderOptions,
  nameId,
  namePlaceholder,
  preservedHolderOptions = [],
  renderBalanceField,
  selectedHolderUserIds = [],
  typePlaceholder,
}: AccountFieldsProps) {
  const currencyOptions = commonCurrencyOptions.some(
    (option) => option.value === defaultCurrency,
  )
    ? commonCurrencyOptions
    : [
        { label: defaultCurrency, value: defaultCurrency },
        ...commonCurrencyOptions,
      ];
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);

  return (
    <>
      <Stack spacing={0.8}>
        <Typography component="label" htmlFor={nameId} sx={fieldLabelSx}>
          账户名称
        </Typography>
        <TextField
          autoComplete="off"
          defaultValue={defaultName}
          fullWidth
          id={nameId}
          name="name"
          placeholder={namePlaceholder}
          required
          slotProps={{ htmlInput: { "aria-label": "账户名称" } }}
        />
      </Stack>

      <AccountFormRow label="账户类型">
        <TextField
          defaultValue={defaultType}
          fullWidth
          name="type"
          required
          select
          slotProps={{
            htmlInput: { "aria-label": "账户类型" },
            ...(typePlaceholder
              ? {
                  select: {
                    displayEmpty: true,
                    renderValue: (value: unknown) => {
                      const selectedOption = accountTypeOptions.find(
                        (option) => option.value === value,
                      );

                      return (
                        selectedOption?.label ?? (
                          <Typography
                            color="text.secondary"
                            component="span"
                            sx={{ fontWeight: 400 }}
                          >
                            {typePlaceholder}
                          </Typography>
                        )
                      );
                    },
                  },
                }
              : {}),
          }}
        >
          {typePlaceholder ? (
            <MenuItem disabled value="">
              {typePlaceholder}
            </MenuItem>
          ) : null}
          {accountTypeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </AccountFormRow>

      <AccountFormRow label={balanceLabel}>
        {renderBalanceField(selectedCurrency)}
      </AccountFormRow>

      <AccountFormRow label="货币">
        <TextField
          defaultValue={defaultCurrency}
          fullWidth
          name="currency"
          onChange={(event) => setSelectedCurrency(event.target.value)}
          required
          select
          slotProps={{ htmlInput: { "aria-label": "货币" } }}
        >
          {currencyOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </AccountFormRow>

      <AccountHolderCheckboxGroup
        holderOptions={holderOptions}
        preservedHolderOptions={preservedHolderOptions}
        selectedUserIds={selectedHolderUserIds}
      />
    </>
  );
}

function AccountFormRow({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      <Typography sx={rowLabelSx}>{label}</Typography>
      <Stack sx={{ flex: 1, minWidth: 0 }}>{children}</Stack>
    </Stack>
  );
}

const fieldLabelSx = {
  fontWeight: 700,
};

const rowLabelSx = {
  flex: "0 0 88px",
  fontWeight: 700,
};
