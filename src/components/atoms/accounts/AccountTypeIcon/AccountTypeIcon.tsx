import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

import type { SvgIconProps } from "@mui/material/SvgIcon";

import type { AccountType } from "types/accounts";

/** 账户类型图标：账户卡片、创建账本向导的账户步骤与账户表单共用。 */
export function AccountTypeIcon({
  fontSize = "small",
  type,
}: {
  fontSize?: SvgIconProps["fontSize"];
  type: AccountType;
}) {
  const iconProps = { fontSize };

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
