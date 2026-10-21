import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ledgerFeatureSettingMessages } from "config/ledgerMessages";
import {
  LedgerFeatureSwitchCard,
  type LedgerFeatureSwitchCardProps,
} from "organisms/ledgers/LedgerFeatureSwitchCard/LedgerFeatureSwitchCard";

const messages = ledgerFeatureSettingMessages.multiAccountPayment;

type LedgerMultiAccountPaymentSettingProps = Pick<
  LedgerFeatureSwitchCardProps,
  "canEdit" | "enabled" | "onChange" | "onRetry" | "state"
> & {
  /**
   * 开启状态下开关下方的说明。默认说明「已有多账户记录时无法关闭」只适用于
   * 已有账本；创建账本向导中尚无记录，传入 null 不显示。
   */
  enabledDescription?: ReactNode;
};

/** 账本「多账户付款」开关（#931）：开启后记账表单才能添加多个付款账户。 */
export function LedgerMultiAccountPaymentSetting({
  enabled,
  enabledDescription = messages.enabledDescription,
  ...props
}: LedgerMultiAccountPaymentSettingProps) {
  const note = enabled ? enabledDescription : messages.disabledDescription;

  return (
    <LedgerFeatureSwitchCard
      {...props}
      description={messages.description}
      enabled={enabled}
      icon={<PaymentsRoundedIcon />}
      sectionTitle={messages.sectionTitle}
      switchLabel={messages.switchLabel}
    >
      {note ? (
        <Typography color="textSecondary" variant="body2">
          {note}
        </Typography>
      ) : null}
    </LedgerFeatureSwitchCard>
  );
}
