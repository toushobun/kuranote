"use client";

import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { merchantText } from "config/merchantText";
import { designTokens } from "theme/theme";
import type { ServerAction } from "types/actions";
import type { Merchant } from "types/merchants";

type MerchantNameOption = {
  id: string;
  isFormalName: boolean;
  label: string;
  selected: boolean;
};

function MerchantNameOptionButton({
  disabled,
  option,
}: {
  disabled: boolean;
  option: MerchantNameOption;
}) {
  const { pending: formPending } = useFormStatus();
  const scrollPosition = useRef<{ left: number; top: number } | null>(null);
  const isPending = disabled || formPending;

  useEffect(() => {
    if (isPending || !scrollPosition.current) return;
    const position = scrollPosition.current;
    scrollPosition.current = null;
    // Next.js 重新验证数据后可能重置滚动位置，当前操作完成才恢复。
    if (window.scrollX !== position.left || window.scrollY !== position.top) {
      window.scrollTo({ ...position, behavior: "instant" });
    }
  }, [isPending]);

  const { id, isFormalName, label, selected } = option;
  return (
    <ButtonBase
      aria-label={merchantText.displayNameOptionLabel(label, selected)}
      aria-pressed={selected}
      disabled={isPending}
      name="aliasId"
      onClick={() => {
        scrollPosition.current = { left: window.scrollX, top: window.scrollY };
      }}
      type="submit"
      value={id}
      sx={{
        "&.Mui-focusVisible": {
          outline: "auto",
          outlineOffset: (theme) => theme.spacing(0.25),
        },
        "&:active": {
          bgcolor: selected ? "primary.dark" : "action.selected",
        },
        "@media (hover: hover)": {
          "&:hover": {
            bgcolor: selected ? "primary.main" : "action.hover",
          },
        },
        bgcolor: selected ? "primary.main" : "transparent",
        border: 1,
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: `${designTokens.radius.sm}px`,
        color: selected ? "primary.contrastText" : "text.primary",
        display: "flex",
        gap: 0.75,
        justifyContent: "flex-start",
        minHeight: (theme) => theme.spacing(3.5),
        px: 1,
        py: 0.25,
        textAlign: "left",
      }}
    >
      <Typography
        component="span"
        variant="body2"
        sx={{
          flex: 1,
          fontWeight: isFormalName ? 700 : 600,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {label}
      </Typography>
      {selected ? <StarRoundedIcon fontSize="small" /> : null}
    </ButtonBase>
  );
}

export function MerchantNameOptions({
  merchant,
  pending = false,
  setPreferredAliasAction,
}: {
  merchant: Merchant;
  pending?: boolean;
  setPreferredAliasAction?: ServerAction;
}) {
  const options: MerchantNameOption[] = [
    {
      id: "",
      isFormalName: true,
      label: merchant.name,
      selected: !merchant.aliases.some((alias) => alias.is_preferred),
    },
    ...merchant.aliases.map((alias) => ({
      id: alias.id,
      isFormalName: false,
      label: alias.alias,
      selected: alias.is_preferred,
    })),
  ];

  return (
    <Stack
      component="form"
      action={setPreferredAliasAction}
      direction="row"
      sx={{ flexWrap: "wrap", gap: 0.75 }}
    >
      <input name="merchantId" type="hidden" value={merchant.id} />
      {options.map((option) => (
        <MerchantNameOptionButton
          disabled={pending || !setPreferredAliasAction}
          key={option.id}
          option={option}
        />
      ))}
    </Stack>
  );
}
