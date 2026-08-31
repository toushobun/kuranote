import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button, { type ButtonProps } from "@mui/material/Button";

export type CreateButtonProps = Omit<
  ButtonProps,
  "href" | "startIcon" | "variant"
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
    return <Button {...sharedProps} href={href} />;
  }

  return <Button {...sharedProps} />;
}
