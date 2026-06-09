import type { PaperProps } from "@mui/material/Paper";

import { GlassCard } from "atoms/ui/GlassCard";
import { designTokens } from "theme/theme";

export function SectionCard({ sx, ...props }: PaperProps) {
  return (
    <GlassCard
      sx={[
        {
          p: designTokens.spacing.card,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
