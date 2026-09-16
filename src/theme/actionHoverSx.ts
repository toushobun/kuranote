export const actionHoverInteractionSx = {
  "&:focus-visible": {
    backgroundColor: "action.hover",
  },
  "@media (hover: hover)": {
    "&:hover": {
      backgroundColor: "action.hover",
    },
  },
} as const;
