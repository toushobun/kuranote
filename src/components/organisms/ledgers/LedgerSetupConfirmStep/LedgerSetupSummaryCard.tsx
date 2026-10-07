import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import { ledgerSetupConfirmMessages } from "config/ledgerSetupMessages";
import { designTokens } from "theme/theme";

type LedgerSetupSummaryCardProps = {
  children?: ReactNode;
  /** 标题下方的说明文字。 */
  description?: ReactNode;
  /** 「修改」按钮禁用（提交中）。 */
  editDisabled?: boolean;
  icon: ReactNode;
  /** 点击「修改」时调用；省略时不显示「修改」按钮。 */
  onEdit?: () => void;
  /** 跳过或数量为 0：虚线边框 + 浅色底，并在标题旁显示「已跳过」。 */
  skipped?: boolean;
  title: string;
};

/** 确认一览的摘要卡片：标题行为图标 + 标题，右侧「修改」文字按钮。 */
export function LedgerSetupSummaryCard({
  children,
  description,
  editDisabled = false,
  icon,
  onEdit,
  skipped = false,
  title,
}: LedgerSetupSummaryCardProps) {
  const titleId = useId();

  return (
    <SoftCard
      aria-labelledby={titleId}
      component="section"
      sx={skipped ? skippedCardSx : cardSx}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1.25} sx={headerSx}>
          <Box sx={iconBoxSx}>{icon}</Box>
          <Stack direction="row" spacing={1} sx={titleRowSx}>
            <Typography component="h4" id={titleId} sx={titleSx}>
              {title}
            </Typography>
            {skipped ? (
              <Typography component="span" sx={skippedBadgeSx}>
                {ledgerSetupConfirmMessages.skipped}
              </Typography>
            ) : null}
          </Stack>
          {onEdit ? (
            <Button
              aria-label={ledgerSetupConfirmMessages.editLabel(title)}
              disabled={editDisabled}
              onClick={onEdit}
              size="small"
              sx={editButtonSx}
              variant="text"
            >
              {ledgerSetupConfirmMessages.edit}
            </Button>
          ) : null}
        </Stack>
        {description ? (
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
        ) : null}
        {children}
      </Stack>
    </SoftCard>
  );
}

const cardSx = {
  p: { xs: 1.75, sm: 2 },
};

const skippedCardSx = {
  ...cardSx,
  "&&": {
    bgcolor: "action.hover",
    border: "1px dashed",
    borderColor: "divider",
    boxShadow: "none",
  },
};

const headerSx = {
  alignItems: "center",
  minHeight: 40,
};

const iconBoxSx = {
  alignItems: "center",
  bgcolor: "var(--user-theme-icon-badge-bg)",
  borderRadius: `${designTokens.radius.sm}px`,
  color: "var(--user-theme-icon-badge-color)",
  display: "inline-flex",
  flexShrink: 0,
  height: 36,
  justifyContent: "center",
  width: 36,
  "& .MuiSvgIcon-root": {
    fontSize: 21,
  },
};

const titleRowSx = {
  alignItems: "center",
  flex: 1,
  flexWrap: "wrap",
  minWidth: 0,
};

const titleSx = {
  fontSize: 16,
  fontWeight: 900,
};

const skippedBadgeSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: `${designTokens.radius.full}px`,
  color: "text.secondary",
  fontSize: 12,
  fontWeight: 800,
  px: 1,
  py: 0.25,
};

const editButtonSx = {
  color: "var(--user-theme-action-text)",
  flexShrink: 0,
  fontWeight: 800,
  minHeight: 40,
  minWidth: 0,
};
