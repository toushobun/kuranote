"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { designTokens } from "theme/theme";
import type { AccountHolderOption } from "types/accounts";
import { getAccountHolderLabel } from "utils/accounts";

type AccountHolderCheckboxGroupProps = {
  holderOptions: AccountHolderOption[];
  preservedHolderOptions?: AccountHolderOption[];
  selectedUserIds?: string[];
};

export function AccountHolderCheckboxGroup({
  holderOptions,
  preservedHolderOptions = [],
  selectedUserIds = [],
}: AccountHolderCheckboxGroupProps) {
  const selectedUserIdSet = new Set(selectedUserIds);
  const hasOptions = holderOptions.length > 0;
  const hasPreservedOptions = preservedHolderOptions.length > 0;

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Typography id="account-holder-label" sx={holderLabelSx}>
          持有人
        </Typography>
        <Box aria-labelledby="account-holder-label" sx={holderGroupSx}>
          {hasOptions || hasPreservedOptions ? (
            <>
              {holderOptions.map((option) => (
                <FormControlLabel
                  key={option.user_id}
                  control={
                    <Checkbox
                      checkedIcon={<CheckCircleRoundedIcon fontSize="small" />}
                      defaultChecked={selectedUserIdSet.has(option.user_id)}
                      icon={<Box sx={uncheckedIconSx} />}
                      name="holderUserIds"
                      value={option.user_id}
                    />
                  }
                  label={getAccountHolderLabel(option)}
                  labelPlacement="start"
                  sx={holderOptionSx}
                />
              ))}
              {preservedHolderOptions.map((option) => (
                <FormControlLabel
                  key={option.user_id}
                  control={
                    <Checkbox
                      checked
                      checkedIcon={<CheckCircleRoundedIcon fontSize="small" />}
                      disabled
                    />
                  }
                  label={
                    <>
                      {getAccountHolderLabel(option)}（非活跃，保存时保留）
                      <input
                        name="holderUserIds"
                        type="hidden"
                        value={option.user_id}
                      />
                    </>
                  }
                  labelPlacement="start"
                  sx={holderOptionSx}
                />
              ))}
            </>
          ) : (
            <Typography color="text.secondary" variant="body2">
              暂无可选持有人
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider />
      <Stack direction="row" spacing={1} sx={holderHelperSx}>
        <LightbulbOutlinedIcon fontSize="small" />
        <Typography color="text.secondary" variant="body2">
          {hasOptions || hasPreservedOptions
            ? hasPreservedOptions
              ? "持有人用于标识该账户的主要使用者；非活跃持有人会在保存时保留。"
              : "持有人用于标识该账户的主要使用者，可多选。"
            : "当前账本没有可选持有人。"}
        </Typography>
      </Stack>
    </Stack>
  );
}

const holderLabelSx = {
  color: "text.primary",
  flex: "0 0 88px",
  fontWeight: 700,
};

const holderGroupSx = {
  alignItems: "center",
  display: "flex",
  flex: 1,
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 1,
  minWidth: 0,
};

const holderOptionSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.full}px`,
  display: "inline-flex",
  gap: 0.5,
  m: 0,
  minHeight: 40,
  px: 1.5,
  width: "fit-content",
  "&:has(.Mui-checked)": {
    background: "var(--user-theme-fab-bg)",
    borderColor: "transparent",
    color: "var(--user-theme-fab-text)",
  },
  "& .MuiCheckbox-root": {
    color: "inherit",
    p: 0,
  },
  "&:has(.Mui-checked) .MuiCheckbox-root": {
    color: "white",
  },
  "& .MuiFormControlLabel-label": {
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
};

const uncheckedIconSx = {
  height: 20,
  width: 20,
};

const holderHelperSx = {
  alignItems: "flex-start",
  color: "var(--user-theme-action-text)",
};
