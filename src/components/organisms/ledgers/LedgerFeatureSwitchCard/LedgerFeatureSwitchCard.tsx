import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerFeatureSettingMessages } from "config/ledgerMessages";
import { designTokens } from "theme/theme";

export type LedgerFeatureSwitchCardProps = {
  canEdit?: boolean;
  /** 开关行下方的补充内容（预览、说明等），由各功能按开关状态决定。 */
  children?: ReactNode;
  description: ReactNode;
  enabled: boolean;
  icon: ReactNode;
  onChange: (enabled: boolean) => void;
  onRetry?: () => void;
  sectionTitle: string;
  state?: "error" | "loading" | "ready";
  /** 开关行标题，同时作为 Switch 的可访问名称。 */
  switchLabel: string;
};

/** 账本功能开关卡片：特殊状态、多账户付款等账本级功能共用的布局与只读提示。 */
export function LedgerFeatureSwitchCard({
  canEdit = true,
  children,
  description,
  enabled,
  icon,
  onChange,
  onRetry,
  sectionTitle,
  state = "ready",
  switchLabel,
}: LedgerFeatureSwitchCardProps) {
  return (
    <Stack component="section" spacing={0.9}>
      <Typography component="h2" sx={sectionTitleSx}>
        {sectionTitle}
      </Typography>
      <SoftCard sx={cardSx}>
        {state === "loading" ? (
          <Stack aria-live="polite" direction="row" role="status" sx={stateSx}>
            <CircularProgress size={22} />
            <Typography color="textSecondary" variant="body2">
              {ledgerFeatureSettingMessages.loading}
            </Typography>
          </Stack>
        ) : null}

        {state === "error" ? (
          <Alert
            action={
              onRetry ? (
                <Button color="inherit" onClick={onRetry} size="small">
                  {ledgerFeatureSettingMessages.retry}
                </Button>
              ) : undefined
            }
            severity="error"
          >
            {ledgerFeatureSettingMessages.loadFailed}
          </Alert>
        ) : null}

        {state === "ready" ? (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.4} sx={{ alignItems: "center" }}>
              <Box sx={iconBoxSx}>{icon}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={titleSx}>{switchLabel}</Typography>
                <Typography color="textSecondary" variant="body2">
                  {description}
                </Typography>
              </Box>
              <Switch
                checked={enabled}
                disabled={!canEdit}
                onChange={(event) => onChange(event.target.checked)}
                slotProps={{ input: { "aria-label": switchLabel } }}
              />
            </Stack>

            {children}

            {!canEdit ? (
              <Typography color="textSecondary" variant="caption">
                {ledgerFeatureSettingMessages.canEditOnly}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </SoftCard>
    </Stack>
  );
}

const sectionTitleSx = {
  fontSize: { xs: 18, sm: 19 },
  fontWeight: 900,
  px: 0.35,
};

const cardSx = {
  borderRadius: `${designTokens.radius.lg}px`,
  p: { xs: 1.5, sm: 1.75 },
};

const stateSx = {
  alignItems: "center",
  gap: 1,
  justifyContent: "center",
  minHeight: 96,
};

const iconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: "50%",
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 46,
  justifyContent: "center",
  width: 46,
};

const titleSx = { fontWeight: 800 };
