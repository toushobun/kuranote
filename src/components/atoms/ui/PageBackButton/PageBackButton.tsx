"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

type PageBackButtonProps = {
  "aria-label": string;
  href: string;
};

/** 设置页与记账页共用的无框返回链接。 */
export function PageBackButton({
  "aria-label": label,
  href,
}: PageBackButtonProps) {
  return (
    <IconButton
      aria-label={label}
      component={Link}
      href={href}
      sx={{
        color: "text.secondary",
        height: 40,
        justifySelf: "start",
        width: 40,
        "@media (hover: hover)": {
          "&:hover": { bgcolor: "action.hover" },
        },
      }}
    >
      <ArrowBackRoundedIcon />
    </IconButton>
  );
}
