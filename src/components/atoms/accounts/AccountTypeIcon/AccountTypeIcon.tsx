import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

import type { AccountType } from "types/accounts";

/** 账户类型图标：账户卡片与创建账本向导的账户步骤共用。 */
export function AccountTypeIcon({ type }: { type: AccountType }) {
  const iconProps = { fontSize: "small" as const };

  switch (type) {
    case "cash":
      return <PaymentsOutlinedIcon {...iconProps} />;
    case "bank":
      return <AccountBalanceOutlinedIcon {...iconProps} />;
    case "credit_card":
      return <CreditCardOutlinedIcon {...iconProps} />;
    case "e_money":
      return <AccountBalanceWalletOutlinedIcon {...iconProps} />;
    default:
      return <MoreHorizRoundedIcon {...iconProps} />;
  }
}
