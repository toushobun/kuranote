"use client";

import Button from "@mui/material/Button";
import Link from "next/link";
import type { ReactNode } from "react";

type BottomNavButtonProps = {
  href: string;
  icon?: ReactNode;
  label: string;
  selected: boolean;
};

export function BottomNavButton({
  href,
  icon,
  label,
  selected,
}: BottomNavButtonProps) {
  return (
    <Button
      aria-current={selected ? "page" : undefined}
      component={Link}
      href={href}
      size="small"
      variant="text"
      sx={{
        alignItems: "center",
        bgcolor: selected
          ? "var(--user-theme-bottom-nav-active-bg)"
          : "transparent",
        borderRadius: 2,
        color: selected
          ? "var(--user-theme-bottom-nav-active)"
          : "var(--user-theme-bottom-nav-inactive)",
        display: "inline-flex",
        flexDirection: "column",
        fontWeight: selected ? 700 : 500,
        gap: icon ? 0.25 : 0,
        minWidth: 52,
      }}
    >
      {icon}
      {label}
    </Button>
  );
}
