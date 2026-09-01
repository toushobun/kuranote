import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Button, { type ButtonProps } from "@mui/material/Button";
import Link from "next/link";

type CreateButtonCommonProps = "href" | "startIcon" | "variant";

export type CreateButtonProps =
  | (Omit<ButtonProps, CreateButtonCommonProps> & { href?: undefined })
  | (Omit<
      ButtonProps<typeof Link>,
      CreateButtonCommonProps | "component"
    > & {
      href: string;
    });

export function CreateButton(props: CreateButtonProps) {
  if (typeof props.href === "string") {
    const { href, ...linkProps } = props;
    return (
      <Button
        {...linkProps}
        component={Link}
        href={href}
        startIcon={<AddRoundedIcon />}
        variant="contained"
      />
    );
  }

  return (
    <Button
      {...props}
      startIcon={<AddRoundedIcon />}
      variant="contained"
    />
  );
}
