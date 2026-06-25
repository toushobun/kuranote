import Paper, { type PaperProps } from "@mui/material/Paper";

import { designTokens } from "theme/theme";

export function SoftCard({ sx, ...props }: PaperProps) {
  return (
    <Paper
      elevation={0}
      sx={[
        {
          backgroundColor: "var(--user-theme-card-bg)",
          backgroundImage: "none",
          border: "1px solid var(--user-theme-card-border)",
          borderRadius: `${designTokens.radius.lg}px`,
          boxShadow: "var(--user-theme-card-shadow)",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
