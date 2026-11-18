"use client";

import Link from "next/link";

import { designTokens } from "theme/theme";
import { ActionButton } from "atoms/ui/ActionButton/ActionButton";
import type { ActionButtonProps } from "atoms/ui/ActionButton/ActionButton";

type PrimaryActionButtonCommonProps = "href" | "variant";

export type PrimaryActionButtonProps =
  | (Omit<ActionButtonProps, PrimaryActionButtonCommonProps> & {
      href?: undefined;
    })
  | (Omit<
      ActionButtonProps<typeof Link>,
      PrimaryActionButtonCommonProps | "component"
    > & {
      href: string;
    });

export function PrimaryActionButton(props: PrimaryActionButtonProps) {
  if (typeof props.href === "string") {
    const { href, sx, ...linkProps } = props;
    return (
      <ActionButton<typeof Link>
        {...linkProps}
        component={Link}
        href={href}
        sx={[primaryActionButtonSx, ...(Array.isArray(sx) ? sx : [sx])]}
        variant="contained"
      />
    );
  }

  const { sx, ...buttonProps } = props;

  return (
    <ActionButton
      {...buttonProps}
      sx={[primaryActionButtonSx, ...(Array.isArray(sx) ? sx : [sx])]}
      variant="contained"
    />
  );
}

const primaryButtonColors = {
  background: "var(--user-theme-fab-bg)",
  color: "var(--user-theme-fab-text)",
} as const;

const primaryActionButtonSx = {
  borderRadius: `${designTokens.radius.full}px`,
  fontWeight: 900,
  minHeight: 48,
  "&:not(.Mui-disabled)": primaryButtonColors,
  "&&[data-action-pending='true'].Mui-disabled.MuiButton-contained":
    primaryButtonColors,
  "@media (hover: hover)": {
    "&:not(.Mui-disabled):hover": {
      background: "var(--user-theme-fab-bg)",
      filter: "brightness(1.04)",
    },
  },
} as const;
