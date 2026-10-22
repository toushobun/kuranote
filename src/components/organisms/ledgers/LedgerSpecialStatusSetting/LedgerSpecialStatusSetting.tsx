import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { TransactionBusinessBadge } from "atoms/TransactionBusinessBadge/TransactionBusinessBadge";
import { transactionSpecialStatuses } from "internal/transaction";
import {
  LedgerFeatureSwitchCard,
  type LedgerFeatureSwitchCardProps,
} from "organisms/ledgers/LedgerFeatureSwitchCard/LedgerFeatureSwitchCard";

// 退款不是 transaction_item.special_status 里的一个状态（它通过金额关联表
// transaction_item_refund_link 表达，明细上展示的是"已退款 ¥X"这种带金额的
// 标注，不是固定徽标），所以这两项只在这里作为功能说明用的预览 Chip，不接入
// TransactionBusinessBadge 那套真实状态徽标体系，避免误导成额外可以手动选择的状态。
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

const defaultDisabledDescription =
  "如果账本内还有处于报销流程的明细，将无法关闭；请先处理完这些明细。";

type LedgerSpecialStatusSettingProps = Pick<
  LedgerFeatureSwitchCardProps,
  "canEdit" | "enabled" | "onChange" | "onRetry" | "state"
> & {
  /**
   * 关闭状态下开关下方的说明。默认说明只适用于已有账本；
   * 创建账本向导中尚无明细，传入 null 不显示。
   */
  disabledDescription?: ReactNode;
};

export function LedgerSpecialStatusSetting({
  disabledDescription = defaultDisabledDescription,
  enabled,
  ...props
}: LedgerSpecialStatusSettingProps) {
  return (
    <LedgerFeatureSwitchCard
      {...props}
      description="标记待报销支出，报销 / 退款到账时在收入页完成关联。"
      enabled={enabled}
      icon={<ReceiptLongRoundedIcon />}
      sectionTitle="明细特殊状态"
      switchLabel="启用特殊状态"
    >
      {enabled ? (
        <Stack direction="row" sx={badgeListSx}>
          {transactionSpecialStatuses.map((status) => (
            <TransactionBusinessBadge
              key={status}
              status={{
                incomeLinkRole: null,
                offsetComposition: {
                  refundAmount: "0",
                  reimbursementAmount: "0",
                },
                settlementStatus: status,
              }}
            />
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
      ) : disabledDescription ? (
        <Typography color="textSecondary" variant="body2">
          {disabledDescription}
        </Typography>
      ) : null}
    </LedgerFeatureSwitchCard>
  );
}

const badgeListSx = { flexWrap: "wrap", gap: 0.75, pl: 7.5 };
