import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import { TransactionBusinessBadge } from "atoms/TransactionBusinessBadge/TransactionBusinessBadge";
import { SoftCard } from "atoms/ui/SoftCard";
import { transactionSpecialStatuses } from "internal/transaction";

// 退款不是 transaction_item.special_status 里的一个状态（它通过金额关联表
// transaction_item_refund_link 表达，明细上展示的是"已退款 ¥X"这种带金额的
// 标注，不是固定徽标），所以这两项只在这里作为功能说明用的预览 Chip，不接入
// TransactionBusinessBadge 那套真实状态徽标体系，避免误导成"可以手动选择的
// 第三、第四种状态"。
const refundPreviewChips = [
  {
    backgroundColor: "var(--user-theme-business-refund-bg)",
    color: "var(--user-theme-business-refund-text)",
    label: "待退款",
  },
  {
    backgroundColor: "var(--user-theme-business-completed-bg)",
    color: "var(--user-theme-business-completed-text)",
    label: "已退款",
  },
] as const;

type LedgerSpecialStatusSettingProps = {
  canEdit?: boolean;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  onRetry?: () => void;
  state?: "error" | "loading" | "ready";
};

export function LedgerSpecialStatusSetting({
  canEdit = true,
  enabled,
  onChange,
  onRetry,
  state = "ready",
}: LedgerSpecialStatusSettingProps) {
  return (
    <Stack component="section" spacing={0.9}>
      <Typography component="h2" sx={sectionTitleSx}>
        明细特殊状态
      </Typography>
      <SoftCard sx={cardSx}>
        {state === "loading" ? (
          <Stack aria-live="polite" direction="row" role="status" sx={stateSx}>
            <CircularProgress size={22} />
            <Typography color="text.secondary" variant="body2">
              正在加载功能设置…
            </Typography>
          </Stack>
        ) : null}

        {state === "error" ? (
          <Alert
            action={
              onRetry ? (
                <Button color="inherit" onClick={onRetry} size="small">
                  重试
                </Button>
              ) : undefined
            }
            severity="error"
          >
            功能设置加载失败，请稍后重试。
          </Alert>
        ) : null}

        {state === "ready" ? (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.4} sx={{ alignItems: "center" }}>
              <Box sx={iconBoxSx}>
                <ReceiptLongRoundedIcon />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={titleSx}>启用特殊状态</Typography>
                <Typography color="text.secondary" variant="body2">
                  标记待报销支出，报销 / 退款到账时在收入页完成关联。
                </Typography>
              </Box>
              <Switch
                checked={enabled}
                disabled={!canEdit}
                onChange={(event) => onChange(event.target.checked)}
                slotProps={{ input: { "aria-label": "启用特殊状态" } }}
              />
            </Stack>

            {enabled ? (
              <Stack direction="row" sx={badgeListSx}>
                {transactionSpecialStatuses.map((status) => (
                  <TransactionBusinessBadge key={status} status={status} />
                ))}
                {refundPreviewChips.map((chip) => (
                  <Chip
                    key={chip.label}
                    label={chip.label}
                    size="small"
                    sx={{
                      backgroundColor: chip.backgroundColor,
                      color: chip.color,
                      fontWeight: 800,
                    }}
                  />
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" variant="body2">
                如果账本内还有待报销或已报销的明细，将无法关闭；请先处理完这些明细。
              </Typography>
            )}

            {!canEdit ? (
              <Typography color="text.secondary" variant="caption">
                只有管理员或所有者可以修改此设置。
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

const cardSx = { borderRadius: 2, p: { xs: 1.5, sm: 1.75 } };

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

const badgeListSx = { flexWrap: "wrap", gap: 0.75, pl: 7.5 };
