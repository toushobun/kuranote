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
 * 成员列表中的待邀请成员行：名字 +「待邀请」；有有效绑定邀请时在同一行显示
 * 「待接受邀请」与角色。只有管理者会拿到邀请信息，其他成员只看到占位摘要。
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
  const status = invite
    ? placeholderMemberText.inviteMemberBadge
    : placeholderMemberText.pendingLabel;
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
