"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, type ReactNode } from "react";

import { ledgerBasicInfoFieldMessages } from "config/ledgerMessages";
import type { LedgerCreateDefaults } from "internal/ledger";
import { themeColorTokens, type ThemeColorKey } from "theme/themeColorTokens";
import { ledgerCurrencyOptions, ledgerMemberColorOptions } from "types/ledgers";

export type LedgerBasicInfoValues = LedgerCreateDefaults["defaults"];

type LedgerBasicInfoFieldsProps = {
  onChange: (values: LedgerBasicInfoValues) => void;
  values: LedgerBasicInfoValues;
};

/**
 * 账本名称、默认货币、我的显示名、我的个性色四个字段。
 * 字段 name 与 Server Action 的表单解析（validateCreateLedgerForm）一致，
 * 创建账本向导第 1 步使用。
 */
export function LedgerBasicInfoFields({
  onChange,
  values,
}: LedgerBasicInfoFieldsProps) {
  const ledgerNameInputRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<LedgerBasicInfoValues>) {
    onChange({ ...values, ...patch });
  }

  function clearLedgerName() {
    update({ ledgerName: "" });
    ledgerNameInputRef.current?.focus();
  }

  return (
    <Stack spacing={2.1}>
      <BasicInfoField
        htmlFor="create-ledger-name"
        label={ledgerBasicInfoFieldMessages.ledgerNameLabel}
      >
        <TextField
          autoComplete="off"
          fullWidth
          id="create-ledger-name"
          inputRef={ledgerNameInputRef}
          name="ledgerName"
          onChange={(event) => update({ ledgerName: event.target.value })}
          required
          slotProps={{
            htmlInput: {
              maxLength: 100,
            },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={ledgerBasicInfoFieldMessages.clearLedgerName}
                    edge="end"
                    onClick={clearLedgerName}
                    size="small"
                    type="button"
                  >
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              startAdornment: (
                <FieldIconAdornment>
                  <HomeRoundedIcon />
                </FieldIconAdornment>
              ),
            },
          }}
          value={values.ledgerName}
        />
      </BasicInfoField>

      <BasicInfoField
        label={ledgerBasicInfoFieldMessages.currencyLabel}
        labelId="create-ledger-currency-label"
      >
        <TextField
          fullWidth
          id="create-ledger-currency"
          name="baseCurrency"
          onChange={(event) => update({ baseCurrency: event.target.value })}
          required
          select
          slotProps={{
            input: {
              startAdornment: (
                <FieldIconAdornment>
                  <CurrencyExchangeRoundedIcon />
                </FieldIconAdornment>
              ),
            },
            select: {
              labelId: "create-ledger-currency-label",
            },
          }}
          value={values.baseCurrency}
        >
          {ledgerCurrencyOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </BasicInfoField>

      <BasicInfoField
        helperText={ledgerBasicInfoFieldMessages.displayNameHelper}
        htmlFor="create-ledger-display-name"
        label={ledgerBasicInfoFieldMessages.displayNameLabel}
      >
        <TextField
          autoComplete="name"
          fullWidth
          id="create-ledger-display-name"
          name="memberDisplayName"
          onChange={(event) => update({ displayName: event.target.value })}
          required
          slotProps={{
            htmlInput: {
              maxLength: 100,
            },
            input: {
              startAdornment: (
                <FieldIconAdornment>
                  <PersonRoundedIcon />
                </FieldIconAdornment>
              ),
            },
          }}
          value={values.displayName}
        />
      </BasicInfoField>

      <Stack spacing={1.1}>
        <Typography component="p" sx={fieldLabelSx}>
          {ledgerBasicInfoFieldMessages.colorLabel}
        </Typography>
        <input
          name="memberDisplayColor"
          type="hidden"
          value={values.displayColor}
        />
        <Stack
          aria-label={ledgerBasicInfoFieldMessages.colorLabel}
          direction="row"
          role="radiogroup"
          sx={colorPickerSx}
        >
          {ledgerMemberColorOptions.map((colorKey) => (
            <ColorRadio
              checked={colorKey === values.displayColor}
              colorKey={colorKey}
              key={colorKey}
              onChange={(displayColor) => update({ displayColor })}
            />
          ))}
        </Stack>
        <Typography color="text.secondary" variant="body2">
          {ledgerBasicInfoFieldMessages.colorHelper}
        </Typography>
      </Stack>
    </Stack>
  );
}

function BasicInfoField({
  children,
  helperText,
  htmlFor,
  label,
  labelId,
}: {
  children: ReactNode;
  helperText?: string;
  htmlFor?: string;
  label: string;
  labelId?: string;
}) {
  return (
    <Stack spacing={0.9}>
      {htmlFor ? (
        <Typography
          component="label"
          htmlFor={htmlFor}
          id={labelId}
          sx={fieldLabelSx}
        >
          {label}
        </Typography>
      ) : (
        <Typography component="span" id={labelId} sx={fieldLabelSx}>
          {label}
        </Typography>
      )}
      {children}
      {helperText ? (
        <Typography color="text.secondary" variant="body2">
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  );
}

function FieldIconAdornment({ children }: { children: ReactNode }) {
  return (
    <InputAdornment position="start">
      <Box sx={fieldIconSx}>{children}</Box>
    </InputAdornment>
  );
}

function ColorRadio({
  checked,
  colorKey,
  onChange,
}: {
  checked: boolean;
  colorKey: ThemeColorKey;
  onChange: (colorKey: ThemeColorKey) => void;
}) {
  const colorToken = themeColorTokens[colorKey];

  return (
    <Box component="label" sx={colorOptionLabelSx}>
      <input
        aria-label={colorToken.label}
        checked={checked}
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

const fieldLabelSx = {
  color: "text.primary",
  fontSize: 16,
  fontWeight: 900,
};

const fieldIconSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  height: 38,
  justifyContent: "center",
  width: 38,
  "& .MuiSvgIcon-root": {
    fontSize: 23,
  },
};

const colorPickerSx = {
  alignItems: "center",
  flexWrap: "wrap",
  gap: { xs: 1.2, sm: 1.45 },
};

const colorOptionLabelSx = {
  cursor: "pointer",
  display: "inline-flex",
  position: "relative",
  "& input:focus-visible + span": {
    outline: "3px solid",
    outlineColor: "primary.light",
    outlineOffset: 3,
  },
  "& input:checked + span": {
    borderColor: "var(--user-theme-action-text)",
    boxShadow: "0 0 0 3px var(--user-theme-icon-badge-bg)",
    transform: "scale(1.06)",
  },
  "& input:checked + span .MuiSvgIcon-root": {
    opacity: 1,
  },
};

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
    height: 44,
    justifyContent: "center",
    transition: "transform 160ms ease, box-shadow 160ms ease",
    width: 44,
    "& .MuiSvgIcon-root": {
      fontSize: 24,
      opacity: 0,
    },
  } as const;
}
