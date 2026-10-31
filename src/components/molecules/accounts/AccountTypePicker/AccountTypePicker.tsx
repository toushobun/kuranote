"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";

import { AccountTypeIcon } from "atoms/accounts/AccountTypeIcon/AccountTypeIcon";
import { accountFormMessages } from "config/accountMessages";
import { designTokens } from "theme/theme";
import { visuallyHiddenInputStyle } from "theme/visuallyHiddenInputStyle";
import { accountTypeOptions, type AccountType } from "types/accounts";

type AccountTypePickerProps = {
  name: string;
  onChange: (type: AccountType) => void;
  value: AccountType | null;
};

/**
 * 账户类型图标格子单选。内部是同名单选框，未选择时由浏览器的 required 校验拦截提交。
 */
export function AccountTypePicker({
  name,
  onChange,
  value,
}: AccountTypePickerProps) {
  const labelId = useId();

  return (
    <Stack spacing={1}>
      <Typography id={labelId} sx={labelSx}>
        {accountFormMessages.typeLabel}
      </Typography>
      <Box aria-labelledby={labelId} role="radiogroup" sx={gridSx}>
        {accountTypeOptions.map((option) => (
          <Box component="label" key={option.value} sx={tileLabelSx}>
            <input
              checked={value === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              required
              style={visuallyHiddenInputStyle}
              type="radio"
              value={option.value}
            />
            <Box component="span" sx={tileSx}>
              <AccountTypeIcon fontSize="medium" type={option.value} />
              <Box component="span" sx={tileTextSx}>
                {option.label}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

const labelSx = {
  color: "text.secondary",
  fontSize: 14,
  fontWeight: 700,
};

const gridSx = {
  display: "grid",
  gap: 1,
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
};

const tileLabelSx = {
  cursor: "pointer",
  display: "flex",
  position: "relative",
  "& input:focus-visible + span": {
    outline: "3px solid",
    outlineColor: "primary.light",
    outlineOffset: 2,
  },
  "& input:checked + span": {
    background: "var(--user-theme-fab-bg)",
    borderColor: "transparent",
    boxShadow: "var(--user-theme-card-shadow)",
    color: "var(--user-theme-fab-text)",
  },
  "& input:checked + span > span": {
    color: "inherit",
  },
};

const tileSx = {
  alignItems: "center",
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.item}px`,
  color: "var(--user-theme-action-text)",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: 0.75,
  justifyContent: "center",
  minHeight: 72,
  px: 0.25,
  py: 1.25,
  transition: "background 120ms ease, color 120ms ease",
};

const tileTextSx = {
  color: "text.primary",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.2,
  textAlign: "center",
  whiteSpace: "nowrap",
};
