import Button, { type ButtonProps } from "@mui/material/Button";
import Link from "next/link";

export const primaryActionButtonNoHoverBrightenSx = {
  "&:not(.Mui-disabled):hover": { filter: "none" },
} as const;

type PrimaryActionButtonCommonProps = "href" | "variant";

export type PrimaryActionButtonProps =
  | (Omit<ButtonProps, PrimaryActionButtonCommonProps> & { href?: undefined })
  | (Omit<
      ButtonProps<typeof Link>,
      PrimaryActionButtonCommonProps | "component"
    > & {
      href: string;
    });

export function PrimaryActionButton(props: PrimaryActionButtonProps) {
  if (typeof props.href === "string") {
    const { href, sx, ...linkProps } = props;
    return (
      <Button
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
    <Button
      {...buttonProps}
      sx={[primaryActionButtonSx, ...(Array.isArray(sx) ? sx : [sx])]}
      variant="contained"
    />
  );
}

const primaryActionButtonSx = {
  borderRadius: 999,
  fontWeight: 900,
  minHeight: 48,
  "&:not(.Mui-disabled)": {
    background: "var(--user-theme-fab-bg)",
    color: "var(--user-theme-fab-text)",
  },
  "&:not(.Mui-disabled):hover": {
    background: "var(--user-theme-fab-bg)",
    filter: "brightness(1.04)",
  },
} as const;
