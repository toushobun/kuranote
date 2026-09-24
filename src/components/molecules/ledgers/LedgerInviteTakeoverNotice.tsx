import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import Alert from "@mui/material/Alert";

import { placeholderMemberText } from "config/placeholderMemberText";

/**
 * 绑定占位邀请的接管说明。名字必须来自实时读取的占位显示名；
 * 匿名邀请不使用该说明。
 */
export function LedgerInviteTakeoverNotice({ name }: { name: string }) {
  return (
    <Alert
      icon={<SwapHorizRoundedIcon fontSize="inherit" />}
      severity="info"
      sx={noticeSx}
    >
      {placeholderMemberText.takeoverNotice(name)}
    </Alert>
  );
}

const noticeSx = {
  alignItems: "center",
  fontWeight: 600,
};
