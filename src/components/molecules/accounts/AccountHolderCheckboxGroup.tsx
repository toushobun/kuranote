"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import { placeholderMemberText } from "config/placeholderMemberText";
import { designTokens } from "theme/theme";
import type {
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";
import { getAccountHolderLabel } from "utils/accounts";

type AccountHolderCheckboxGroupProps = {
  holderOptions: AccountHolderOption[];
  placeholderOptions?: AccountPlaceholderHolderOption[];
  preservedHolderOptions?: AccountHolderOption[];
  selectedPlaceholderId?: string | null;
  selectedUserIds?: string[];
};

/** 三态持有人：真实成员 / 待邀请成员（占位）/ 未选择即无持有人，最多选 1 个。 */
type HolderSelection =
  | { id: string; kind: "member" }
  | { id: string; kind: "placeholder" }
  | null;

export function AccountHolderCheckboxGroup({
  holderOptions,
  placeholderOptions = [],
  preservedHolderOptions = [],
  selectedPlaceholderId = null,
  selectedUserIds = [],
}: AccountHolderCheckboxGroupProps) {
  const hasOptions = holderOptions.length > 0;
  const hasPlaceholderOptions = placeholderOptions.length > 0;
  const hasPreservedOptions = preservedHolderOptions.length > 0;
  const hasAnyOptions =
    hasOptions || hasPlaceholderOptions || hasPreservedOptions;
  const [selection, setSelection] = useState<HolderSelection>(() => {
    if (
      selectedPlaceholderId &&
      placeholderOptions.some(
        (option) => option.placeholder_id === selectedPlaceholderId,
      )
    ) {
      return { id: selectedPlaceholderId, kind: "placeholder" };
    }
    const userId = holderOptions.find((option) =>
      selectedUserIds.includes(option.user_id),
    )?.user_id;
    return userId ? { id: userId, kind: "member" } : null;
  });

  function isSelected(kind: "member" | "placeholder", id: string) {
    return selection?.kind === kind && selection.id === id;
  }

  function toggle(kind: "member" | "placeholder", id: string) {
    setSelection(isSelected(kind, id) ? null : { id, kind });
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Typography id="account-holder-label" sx={holderLabelSx}>
          持有人
        </Typography>
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Box aria-labelledby="account-holder-label" sx={holderGroupSx}>
            {hasAnyOptions ? (
              <>
                {holderOptions.map((option) => (
                  <HolderOptionChip
                    checked={isSelected("member", option.user_id)}
                    key={option.user_id}
                    label={getAccountHolderLabel(option)}
                    name="holderUserIds"
                    onToggle={() => toggle("member", option.user_id)}
                    value={option.user_id}
                  />
                ))}
                {preservedHolderOptions.map((option) => (
                  <HolderOptionChip
                    checked
                    disabled
                    key={option.user_id}
                    label={`${getAccountHolderLabel(option)}（非活跃，保存时保留）`}
                  />
                ))}
              </>
            ) : (
              <Typography color="text.secondary" variant="body2">
                暂无可选持有人
              </Typography>
            )}
          </Box>
          {hasPlaceholderOptions ? (
            <Stack spacing={0.75}>
              <Typography
                color="text.secondary"
                id="account-placeholder-holder-label"
                variant="body2"
                sx={placeholderGroupLabelSx}
              >
                {placeholderMemberText.accountHolderGroupLabel}
              </Typography>
              <Box
                aria-labelledby="account-placeholder-holder-label"
                sx={holderGroupSx}
              >
                {placeholderOptions.map((option) => (
                  <HolderOptionChip
                    checked={isSelected("placeholder", option.placeholder_id)}
                    icon={<HourglassTopRoundedIcon fontSize="small" />}
                    key={option.placeholder_id}
                    label={placeholderMemberText.accountHolderOptionLabel(
                      option.display_name,
                    )}
                    name="holderPlaceholderId"
                    onToggle={() =>
                      toggle("placeholder", option.placeholder_id)
                    }
                    value={option.placeholder_id}
                  />
                ))}
              </Box>
            </Stack>
          ) : null}
        </Stack>
      </Stack>
      <Divider />
      <Stack direction="row" spacing={1} sx={holderHelperSx}>
        <LightbulbOutlinedIcon fontSize="small" />
        <Typography color="text.secondary" variant="body2">
          {hasAnyOptions
            ? hasPreservedOptions
              ? "持有人用于标识该账户的主要使用者，最多选择 1 个；非活跃持有人会在保存时保留。"
              : hasPlaceholderOptions
                ? placeholderMemberText.accountHolderHelper
                : "持有人用于标识该账户的主要使用者，最多选择 1 个。"
            : "当前账本没有可选持有人。"}
        </Typography>
      </Stack>
    </Stack>
  );
}

function HolderOptionChip({
  checked,
  disabled = false,
  icon,
  label,
  name,
  onToggle,
  value,
}: {
  checked: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  name?: string;
  onToggle?: () => void;
  value?: string;
}) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          checkedIcon={<CheckCircleRoundedIcon fontSize="small" />}
          disabled={disabled}
          icon={icon ?? <Box sx={uncheckedIconSx} />}
          name={name}
          onChange={onToggle}
          value={value}
        />
      }
      label={label}
      labelPlacement="start"
      sx={holderOptionSx}
    />
  );
}

const holderLabelSx = {
  color: "text.primary",
  flex: "0 0 88px",
  fontWeight: 700,
  lineHeight: "40px",
};

const placeholderGroupLabelSx = {
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
