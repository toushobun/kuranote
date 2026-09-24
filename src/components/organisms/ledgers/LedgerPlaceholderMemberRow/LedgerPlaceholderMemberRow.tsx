"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import { placeholderMemberText } from "config/placeholderMemberText";
import { ListRowButton } from "molecules/ui/ListRowButton";
import { typographyStyles } from "theme/typographyTokens";
import { ledgerInviteRoleLabels } from "types/ledgers";
import {
  formatInviteCreatedAt,
  type LedgerPlaceholderMemberRowView,
} from "utils/ledgerMembers";

/**
 * 成员列表中的待邀请成员行：名字 + 状态。管理者看到链接状态——已生成时显示
 * 「等待加入」与角色、创建时间，未生成（含撤销后）时显示「未生成链接」；
 * 其他成员拿不到邀请信息，只看到「待邀请」与占位摘要。
 */
export function LedgerPlaceholderMemberRow({
  canManage,
  onClick,
  row,
}: {
  canManage: boolean;
  onClick: () => void;
  row: LedgerPlaceholderMemberRowView;
}) {
  const { invite, placeholder } = row;
  const status = !canManage
    ? placeholderMemberText.pendingLabel
    : invite
      ? placeholderMemberText.statusLinkPending
      : placeholderMemberText.statusNoLink;
  const subtitle = !canManage
    ? placeholderMemberText.rowSubtitleReadOnly
    : invite
      ? `${ledgerInviteRoleLabels[invite.role]} · ${formatInviteCreatedAt(invite.createdAt)}`
      : placeholderMemberText.rowSubtitleNoInvite;

  return (
    <ListRowButton
      aria-label={placeholderMemberText.rowAriaLabel(
        placeholder.displayName,
        status,
      )}
      avatar={<PersonOutlineRoundedIcon />}
      avatarSx={avatarSx}
      onClick={onClick}
      subtitle={
        <Typography color="text.secondary" noWrap variant="body2">
          {subtitle}
        </Typography>
      }
      title={placeholder.displayName}
      trailing={
        <>
          <Chip label={status} sx={statusChipSx(invite !== null)} />
          <ChevronRightRoundedIcon sx={chevronSx} />
        </>
      }
    />
  );
}

const avatarSx = {
  bgcolor: "background.paper",
  border: "1px dashed",
  borderColor: "text.disabled",
  color: "text.secondary",
};

function statusChipSx(hasInvite: boolean) {
  return {
    ...typographyStyles.chipBadge,
    bgcolor: hasInvite ? "warning.light" : "action.hover",
    color: hasInvite ? "warning.dark" : "text.secondary",
    flexShrink: 0,
    fontWeight: 800,
  } as const;
}

const chevronSx = {
  color: "text.secondary",
  flexShrink: 0,
  fontSize: 22,
};
