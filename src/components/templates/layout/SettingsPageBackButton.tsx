"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import IconButton from "@mui/material/IconButton";
import Link from "next/link";

type SettingsPageBackButtonProps = {
  href: string;
  label: string;
};

// component={Link} 需要在客户端组件内传递；loading.tsx 等 Server Component 渲染页面骨架时不能直接传函数。
export function SettingsPageBackButton({
  href,
  label,
}: SettingsPageBackButtonProps) {
  return (
    <IconButton aria-label={label} component={Link} href={href}>
      <ArrowBackRoundedIcon />
    </IconButton>
  );
}
