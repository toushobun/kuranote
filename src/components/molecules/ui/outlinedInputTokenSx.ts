export const outlinedInputTokenSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--user-theme-card-bg)",
    borderRadius: 1.5,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--user-theme-card-border)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--user-theme-field-card-selected-border)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--user-theme-field-card-selected-border)",
    borderWidth: 1,
  },
} as const;
