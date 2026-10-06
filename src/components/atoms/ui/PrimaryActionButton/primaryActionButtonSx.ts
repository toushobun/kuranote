// 与 PrimaryActionButton.tsx（"use client"）分离，Server Component 也能安全引用。
export const primaryActionButtonNoHoverBrightenSx = {
  "@media (hover: hover)": {
    "&:not(.Mui-disabled):hover": { filter: "none" },
  },
} as const;
