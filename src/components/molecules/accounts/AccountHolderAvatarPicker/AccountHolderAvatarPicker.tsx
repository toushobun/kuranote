"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

import { accountFormMessages } from "config/accountMessages";
import { placeholderMemberText } from "config/placeholderMemberText";
import { themeColorTokens } from "theme/themeColorTokens";
import { visuallyHiddenInputStyle } from "theme/visuallyHiddenInputStyle";
import type {
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";
import { getAccountHolderLabel } from "utils/accounts";

import {
  isAccountHolderSelected,
  toggleAccountHolderSelection,
  type AccountHolderSelection,
} from "../accountHolderSelection";

type AccountHolderAvatarPickerProps = {
  holderOptions: AccountHolderOption[];
  onChange: (selection: AccountHolderSelection) => void;
  placeholderOptions?: AccountPlaceholderHolderOption[];
  selection: AccountHolderSelection;
};

/**
 * 持有人头像单选：成员头像用各自的个性色，待邀请成员单独分组并用虚线头像区分。
 * 再次点击已选中的头像取消选择（无持有人）。
 */
export function AccountHolderAvatarPicker({
  holderOptions,
  onChange,
  placeholderOptions = [],
  selection,
}: AccountHolderAvatarPickerProps) {
  const memberGroupId = useId();
  const placeholderGroupId = useId();
  const hasPlaceholderOptions = placeholderOptions.length > 0;

  if (holderOptions.length === 0 && !hasPlaceholderOptions) {
    return (
      <Typography color="textSecondary" variant="body2">
        {accountFormMessages.noHolderOptions}
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "stretch" }}>
      {holderOptions.length > 0 ? (
        <Box
          aria-label={accountFormMessages.holderSection}
          id={memberGroupId}
          role="group"
          sx={avatarGroupSx}
        >
          {holderOptions.map((option) => {
            const colorToken = themeColorTokens[option.display_color];
            return (
              <HolderAvatarOption
                accent={colorToken.accent}
                avatarBackground={colorToken.chipBackground}
                checked={isAccountHolderSelected(
                  selection,
                  "member",
                  option.user_id,
                )}
                key={option.user_id}
                label={getAccountHolderLabel(option)}
                name="holderUserIds"
                onToggle={() =>
                  onChange(
                    toggleAccountHolderSelection(
                      selection,
                      "member",
                      option.user_id,
                    ),
                  )
                }
                selectedTextColor={colorToken.chipText}
                value={option.user_id}
              />
            );
          })}
        </Box>
      ) : null}
      {hasPlaceholderOptions ? (
        <>
          {holderOptions.length > 0 ? (
            <Divider flexItem orientation="vertical" />
          ) : null}
          <Stack spacing={1} sx={{ minWidth: 0 }}>
            <Typography
              color="textSecondary"
              id={placeholderGroupId}
              sx={{ fontSize: 13, fontWeight: 700 }}
            >
              {placeholderMemberText.accountHolderGroupLabel}
            </Typography>
            <Box
              aria-labelledby={placeholderGroupId}
              role="group"
              sx={avatarGroupSx}
            >
              {placeholderOptions.map((option) => (
                <HolderAvatarOption
                  badge={<HourglassTopRoundedIcon sx={badgeIconSx} />}
                  checked={isAccountHolderSelected(
                    selection,
                    "placeholder",
                    option.placeholder_id,
                  )}
                  dashed
                  key={option.placeholder_id}
                  label={option.display_name}
                  name="holderPlaceholderId"
                  onToggle={() =>
                    onChange(
                      toggleAccountHolderSelection(
                        selection,
                        "placeholder",
                        option.placeholder_id,
                      ),
                    )
                  }
                  value={option.placeholder_id}
                />
              ))}
            </Box>
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}

function HolderAvatarOption({
  accent = "var(--user-theme-action-text)",
  avatarBackground = "var(--user-theme-field-card-selected-bg)",
  badge,
  checked,
  dashed = false,
  label,
  name,
  onToggle,
  selectedTextColor = "var(--user-theme-action-text)",
  value,
}: {
  accent?: string;
  avatarBackground?: string;
  badge?: ReactNode;
  checked: boolean;
  dashed?: boolean;
  label: string;
  name: string;
  onToggle: () => void;
  selectedTextColor?: string;
  value: string;
}) {
  return (
    <Box component="label" sx={optionLabelSx}>
      <input
        aria-label={label}
        checked={checked}
        name={name}
        onChange={onToggle}
        style={visuallyHiddenInputStyle}
        type="checkbox"
        value={value}
      />
      <Box
        component="span"
        sx={avatarSx({ accent, avatarBackground, checked, dashed })}
      >
        <PersonRoundedIcon sx={{ fontSize: 30 }} />
        {checked ? (
          <Box component="span" sx={badgeSx(accent)}>
            <CheckRoundedIcon sx={badgeIconSx} />
          </Box>
        ) : badge ? (
          <Box component="span" sx={badgeSx("var(--user-theme-action-text)")}>
            {badge}
          </Box>
        ) : null}
      </Box>
      <Box
        component="span"
        sx={{
          color: checked ? selectedTextColor : "text.primary",
          fontSize: 13,
          fontWeight: checked ? 800 : 600,
          maxWidth: 64,
          overflow: "hidden",
          textAlign: "center",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

const avatarGroupSx = {
  display: "flex",
  flexWrap: "wrap",
  gap: 1.5,
};

const optionLabelSx = {
  alignItems: "center",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 0.75,
  position: "relative",
  "& input:focus-visible + span": {
    outline: "3px solid",
    outlineColor: "primary.light",
    outlineOffset: 2,
  },
};

function avatarSx({
  accent,
  avatarBackground,
  checked,
  dashed,
}: {
  accent: string;
  avatarBackground: string;
  checked: boolean;
  dashed: boolean;
}) {
  return {
    alignItems: "center",
    bgcolor: dashed ? "background.paper" : avatarBackground,
    border: "2px solid",
    borderColor: checked ? accent : dashed ? "divider" : "transparent",
    borderRadius: "50%",
    borderStyle: dashed && !checked ? "dashed" : "solid",
    boxShadow: checked ? `0 0 0 3px ${avatarBackground}` : "none",
    color: dashed ? "text.secondary" : accent,
    display: "flex",
    height: 56,
    justifyContent: "center",
    position: "relative",
    transition: "border-color 120ms ease, box-shadow 120ms ease",
    width: 56,
  } as const;
}

function badgeSx(color: string) {
  return {
    alignItems: "center",
    bgcolor: color,
    border: "2px solid",
    borderColor: "background.paper",
    borderRadius: "50%",
    bottom: -2,
    color: "common.white",
    display: "flex",
    height: 22,
    justifyContent: "center",
    position: "absolute",
    right: -2,
    width: 22,
  } as const;
}

const badgeIconSx = { fontSize: 14 };
