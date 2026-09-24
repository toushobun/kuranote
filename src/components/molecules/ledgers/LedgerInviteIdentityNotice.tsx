import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import Alert from "@mui/material/Alert";

import { placeholderMemberText } from "config/placeholderMemberText";

/**
 * 「以某人身份加入」说明，复制区域与邀请落地页共用。名字必须来自实时读取的
 * 待邀请成员显示名，不使用链接参数或快照。
 */
export function LedgerInviteIdentityNotice({ name }: { name: string }) {
  return (
    <Alert
      icon={<BadgeRoundedIcon fontSize="inherit" />}
      severity="info"
      sx={noticeSx}
    >
      {placeholderMemberText.identityNotice(name)}
    </Alert>
  );
}

const noticeSx = {
  alignItems: "center",
  fontWeight: 600,
};
