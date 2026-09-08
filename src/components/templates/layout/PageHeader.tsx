import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

type PageHeaderVariant = "default" | "compact";

type PageHeaderProps = {
  action?: ReactNode;
  leading?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
  variant?: PageHeaderVariant;
};

export function PageHeader({
  action,
  leading,
  subtitle,
  title,
  variant = "default",
}: PageHeaderProps) {
  const compact = variant === "compact";

  return (
    <Stack
      direction={compact ? "row" : { xs: "column", sm: "row" }}
      spacing={compact ? 1.25 : 2}
      sx={{
        alignItems: compact
          ? "flex-start"
          : { xs: "stretch", sm: "flex-start" },
      }}
    >
      <Stack
        direction="row"
        spacing={compact ? 1.25 : 1.5}
        sx={{ alignItems: "flex-start", flex: 1, minWidth: 0 }}
      >
        {leading ? (
          <Box
            sx={{
              flexShrink: 0,
              ...(compact
                ? {
                    "& > .MuiIconButton-root": {
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: "0 4px 14px rgba(91, 62, 34, 0.08)",
                    },
                  }
                : {}),
            }}
          >
            {leading}
          </Box>
        ) : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component="h1"
            variant={compact ? "h5" : "h4"}
            sx={{
              color: "var(--user-theme-balance-text)",
              fontWeight: compact ? 900 : 800,
              ...(compact ? { lineHeight: 1.25 } : {}),
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              component="div"
              variant={compact ? "body2" : undefined}
              sx={{
                color: compact
                  ? "text.secondary"
                  : "var(--user-theme-subtitle-text)",
                mt: compact ? 0.25 : 1.5,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Stack>
  );
}
