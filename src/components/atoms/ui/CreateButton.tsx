import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Link from "next/link";

import { designTokens } from "theme/theme";

import type { ActionButtonProps } from "./ActionButton/ActionButton";
import { PrimaryActionButton } from "./PrimaryActionButton/PrimaryActionButton";

type CreateButtonCommonProps = "href" | "startIcon" | "variant";

export type CreateButtonProps =
  | (Omit<ActionButtonProps, CreateButtonCommonProps> & { href?: undefined })
  | (Omit<
      ActionButtonProps<typeof Link>,
      CreateButtonCommonProps | "component"
    > & {
      href: string;
    });

export function CreateButton(props: CreateButtonProps) {
  if (typeof props.href === "string") {
    const { href, sx, ...linkProps } = props;
    return (
      <PrimaryActionButton
        {...linkProps}
        href={href}
        startIcon={<AddRoundedIcon />}
        sx={[createButtonBaseSx, ...(Array.isArray(sx) ? sx : [sx])]}
      />
    );
  }

  const { sx, ...buttonProps } = props;

  return (
    <PrimaryActionButton
      {...buttonProps}
      startIcon={<AddRoundedIcon />}
      sx={[createButtonBaseSx, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}

const createButtonBaseSx = {
  borderRadius: `${designTokens.radius.md}px`,
  fontWeight: 700,
  minHeight: 40,
} as const;
