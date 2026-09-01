import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button, { type ButtonProps } from "@mui/material/Button";
import Link from "next/link";

export type CreateButtonProps = Omit<
  ButtonProps,
  "href" | "ref" | "startIcon" | "variant"
> & {
  href?: string;
};

export function CreateButton({ href, ...props }: CreateButtonProps) {
  const sharedProps = {
    ...props,
    startIcon: <AddRoundedIcon />,
    variant: "contained" as const,
  };

  if (href) {
    return <Button {...sharedProps} component={Link} href={href} />;
  }

  return <Button {...sharedProps} />;
}
