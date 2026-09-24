"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useActionState, useState } from "react";

import { placeholderMemberText } from "config/placeholderMemberText";
import { LedgerInviteLinkField } from "molecules/ledgers/LedgerInviteLinkField";
import { LedgerInviteQrCode } from "molecules/ledgers/LedgerInviteQrCode";
import { LedgerInviteTakeoverNotice } from "molecules/ledgers/LedgerInviteTakeoverNotice";
import { LedgerInviteRoleRow } from "molecules/ledgers/LedgerInviteRoleRow";
import { ListRowButton } from "molecules/ui/ListRowButton";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { usePendingLedgerInvites } from "organisms/ledgers/LedgerInvitePendingContext/LedgerInvitePendingContext";
import { LedgerPlaceholderMemberDialog } from "organisms/ledgers/LedgerPlaceholderMemberDialog/LedgerPlaceholderMemberDialog";
import { LedgerPlaceholderMemberRow } from "organisms/ledgers/LedgerPlaceholderMemberRow/LedgerPlaceholderMemberRow";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import {
  ledgerInviteRoleLabels,
  type LedgerInviteActionState,
  type LedgerInviteStateAction,
  type LedgerPlaceholderMemberActions,
  type LedgerPlaceholderMemberSummary,
  type PendingLedgerInvite,
} from "types/ledgers";
import {
  formatInviteCreatedAt,
  groupLedgerPendingPeople,
} from "utils/ledgerMembers";

import { useLedgerInviteEntry } from "./useLedgerInviteEntry";

type LedgerInviteEntryProps = {
  action: LedgerInviteStateAction;
  canInvite: boolean;
  ledgerId: string;
  ledgerName?: string;
  /** 仅管理者传入；为 null 时占位只读，不显示任何管理入口。 */
  placeholderMemberActions?: LedgerPlaceholderMemberActions | null;
  placeholderMembers?: LedgerPlaceholderMemberSummary[];
  token?: string | null;
};

type PlaceholderDialogState =
  | { mode: "create" }
  | { mode: "edit"; placeholderId: string };

const initialLedgerInviteActionState: LedgerInviteActionState = {};

export function LedgerInviteEntry({
  action,
  canInvite,
  ledgerId,
  ledgerName = "当前账本",
  placeholderMemberActions = null,
  placeholderMembers = [],
  token: initialToken = null,
}: LedgerInviteEntryProps) {
  const pendingInvites = usePendingLedgerInvites();
  const { anonymousInvites, placeholderRows } = groupLedgerPendingPeople({
    pendingInvites,
    placeholders: placeholderMembers,
  });
  const canManagePlaceholders = canInvite && placeholderMemberActions !== null;
  const [placeholderDialog, setPlaceholderDialog] =
    useState<PlaceholderDialogState>({ mode: "create" });
  const [placeholderDialogOpen, setPlaceholderDialogOpen] = useState(false);
  const selectedPlaceholderRow =
    placeholderDialog.mode === "edit"
      ? (placeholderRows.find(
          (row) => row.placeholder.id === placeholderDialog.placeholderId,
        ) ?? null)
      : null;
  const [actionState, formAction] = useActionState(
    action,
    initialLedgerInviteActionState,
  );
  const {
    closeCopyFailedFeedback,
    closeCopyFeedback,
    closeCreatedFeedback,
    closeDraft,
    closeInviteDetails,
    closeManagementError,
    closeRevokedFeedback,
    closeRevokeConfirm,
    copied,
    copyFailed,
    copyLink,
    created,
    draftLink,
    draftOpen,
    draftPlaceholderId,
    draftRole,
    draftToken,
    managementError,
    openNewDraft,
    openRevokeConfirm,
    revoked,
    revokeConfirmOpen,
    selectedInvite,
    selectedLink,
    selectedToken,
    selectInvite,
    setDraftRole,
  } = useLedgerInviteEntry({
    actionState,
    initialToken,
  });

  // 接管说明中的名字始终取实时占位列表，不使用 fragment 或邀请中的快照。
  const draftPlaceholder = findPlaceholder(
    placeholderMembers,
    draftPlaceholderId,
  );
  const selectedInvitePlaceholder = findPlaceholder(
    placeholderMembers,
    selectedInvite?.placeholderId ?? null,
  );

  function openPlaceholderDialog(state: PlaceholderDialogState) {
    setPlaceholderDialog(state);
    setPlaceholderDialogOpen(true);
  }

  return (
    <>
      {placeholderRows.map((row) => (
        <LedgerPlaceholderMemberRow
          canManage={canManagePlaceholders}
          key={row.placeholder.id}
          onClick={() =>
            openPlaceholderDialog({
              mode: "edit",
              placeholderId: row.placeholder.id,
            })
          }
          row={row}
        />
      ))}

      {anonymousInvites.map((invite) => (
        <PendingInviteRow
          invite={invite}
          key={invite.id}
          onClick={() => selectInvite(invite)}
        />
      ))}

      <ListRowButton
        avatar={<PeopleAltRoundedIcon />}
        avatarSx={inviteAvatarSx}
        disabled={!canInvite}
        onClick={() => openNewDraft()}
        subtitle={
          <Typography color="text.secondary" noWrap variant="body2">
            {canInvite
              ? "邀请家人、伴侣或朋友加入账本"
              : "仅管理员或所有者可以邀请成员"}
          </Typography>
        }
        title="邀请成员"
        trailing={<ChevronRightRoundedIcon sx={inviteTrailingIconSx} />}
      />

      {canManagePlaceholders ? (
        <ListRowButton
          avatar={<PersonAddAlt1RoundedIcon />}
          avatarSx={inviteAvatarSx}
          onClick={() => openPlaceholderDialog({ mode: "create" })}
          subtitle={
            <Typography color="text.secondary" noWrap variant="body2">
              {placeholderMemberText.addEntrySubtitle}
            </Typography>
          }
          title={placeholderMemberText.addEntryTitle}
          trailing={<ChevronRightRoundedIcon sx={inviteTrailingIconSx} />}
        />
      ) : null}

      <LedgerPlaceholderMemberDialog
        actions={canManagePlaceholders ? placeholderMemberActions : null}
        ledgerId={ledgerId}
        mode={placeholderDialog.mode}
        onClose={() => setPlaceholderDialogOpen(false)}
        onCreateInvite={(placeholderId) => {
          setPlaceholderDialogOpen(false);
          openNewDraft(placeholderId);
        }}
        onOpenInvite={(invite) => {
          setPlaceholderDialogOpen(false);
          selectInvite(invite);
        }}
        open={placeholderDialogOpen}
        row={selectedPlaceholderRow}
      />

      <Dialog fullWidth maxWidth="xs" onClose={closeDraft} open={draftOpen}>
        <form action={formAction}>
          <DialogTitle sx={dialogTitleSx}>
            {draftPlaceholder
              ? placeholderMemberText.draftTitle(draftPlaceholder.displayName)
              : "邀请成员"}
            <IconButton
              aria-label="关闭"
              onClick={closeDraft}
              sx={dialogCloseSx}
              type="button"
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography color="text.secondary" variant="body2">
                {draftPlaceholderId
                  ? placeholderMemberText.generateInviteDescription
                  : "邀请家人、伴侣或朋友加入当前账本，共同记账。"}
              </Typography>

              <LedgerInviteRoleRow
                onChange={draftToken ? undefined : setDraftRole}
                role={draftRole}
              />
              <input name="ledgerId" type="hidden" value={ledgerId} />
              <input name="role" type="hidden" value={draftRole} />
              {draftPlaceholderId ? (
                <input
                  name="placeholderId"
                  type="hidden"
                  value={draftPlaceholderId}
                />
              ) : null}

              <LedgerInviteLinkField link={draftLink} onCopy={copyLink} />
              {draftToken && draftPlaceholder ? (
                <LedgerInviteTakeoverNotice
                  name={draftPlaceholder.displayName}
                />
              ) : null}
              <LedgerInviteQrCode ledgerName={ledgerName} link={draftLink} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            {draftToken ? (
              <Button
                fullWidth
                onClick={() => copyLink(draftLink)}
                startIcon={<ContentCopyRoundedIcon />}
                type="button"
                variant="contained"
              >
                复制链接
              </Button>
            ) : (
              <Button fullWidth type="submit" variant="contained">
                生成邀请链接
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={closeInviteDetails}
        open={selectedInvite !== null && !revokeConfirmOpen}
      >
        <DialogTitle sx={dialogTitleSx}>
          邀请详情
          <IconButton
            aria-label="关闭邀请详情"
            onClick={closeInviteDetails}
            sx={dialogCloseSx}
            type="button"
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedInvite ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <LedgerInviteRoleRow role={selectedInvite.role} />
              <Stack spacing={0.5}>
                <DetailLine
                  label="创建时间"
                  value={formatInviteCreatedAt(selectedInvite.createdAt)}
                />
                <DetailLine label="当前状态" value="等待接受" />
              </Stack>
              {selectedToken ? (
                <>
                  <LedgerInviteLinkField
                    link={selectedLink}
                    onCopy={copyLink}
                  />
                  {selectedInvitePlaceholder ? (
                    <LedgerInviteTakeoverNotice
                      name={selectedInvitePlaceholder.displayName}
                    />
                  ) : null}
                  <LedgerInviteQrCode
                    ledgerName={ledgerName}
                    link={selectedLink}
                  />
                </>
              ) : (
                <>
                  <Typography color="text.secondary" variant="body2">
                    {canInvite
                      ? "邀请链接暂不可读取，请刷新页面后重试。"
                      : "仅管理员或所有者可以查看邀请链接和二维码。"}
                  </Typography>
                  <LedgerInviteQrCode
                    emptyMessage="邀请链接不可读取，无法显示二维码"
                    ledgerName={ledgerName}
                    link=""
                  />
                </>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        {selectedToken || canInvite ? (
          <DialogActions sx={detailActionsSx}>
            {selectedToken ? (
              <Button
                fullWidth
                onClick={() => copyLink(selectedLink)}
                startIcon={<ContentCopyRoundedIcon />}
                type="button"
                variant="contained"
              >
                复制链接
              </Button>
            ) : null}
            {canInvite ? (
              <Button
                color="error"
                fullWidth
                onClick={openRevokeConfirm}
                type="button"
                variant="outlined"
              >
                撤销邀请
              </Button>
            ) : null}
          </DialogActions>
        ) : null}
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={closeRevokeConfirm}
        open={revokeConfirmOpen}
      >
        <form action={formAction}>
          <DialogTitle>确认撤销邀请？</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" variant="body2">
              撤销后，已发送的邀请链接将立即失效，且无法恢复。
            </Typography>
            <input name="intent" type="hidden" value="revoke" />
            <input name="ledgerId" type="hidden" value={ledgerId} />
            <input
              name="inviteId"
              type="hidden"
              value={selectedInvite?.id ?? ""}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={closeRevokeConfirm} type="button">
              取消
            </Button>
            <Button color="error" type="submit" variant="contained">
              确认撤销
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <SuccessFeedbackDialog
        aboveModal
        bottomOffset={feedbackBottomOffset}
        onClose={closeCopyFeedback}
        open={copied}
        title="复制成功"
      />
      <SuccessFeedbackDialog
        aboveModal
        bottomOffset={feedbackBottomOffset}
        onClose={closeCreatedFeedback}
        open={created}
        title="创建链接成功，快去复制给你的亲友吧"
      />
      <SuccessFeedbackDialog
        bottomOffset={feedbackBottomOffset}
        description="该邀请链接已失效。"
        onClose={closeRevokedFeedback}
        open={revoked}
        title="邀请已撤销"
      />
      <FailureFeedbackDialog
        aboveModal
        bottomOffset={feedbackBottomOffset}
        onClose={closeCopyFailedFeedback}
        open={copyFailed}
        title="复制失败，请手动复制邀请链接"
      />
      <FailureFeedbackDialog
        aboveModal
        bottomOffset={feedbackBottomOffset}
        description={managementError?.message}
        onClose={closeManagementError}
        open={managementError !== null}
        title={
          managementError?.operation === "create"
            ? "生成邀请链接失败"
            : "撤销邀请失败"
        }
      />
    </>
  );
}

function PendingInviteRow({
  invite,
  onClick,
}: {
  invite: PendingLedgerInvite;
  onClick: () => void;
}) {
  const createdAtLabel = formatInviteCreatedAt(invite.createdAt);

  return (
    <ListRowButton
      aria-label={`待接受邀请，${ledgerInviteRoleLabels[invite.role]}，${createdAtLabel}`}
      avatar={<HourglassTopRoundedIcon />}
      avatarSx={pendingAvatarSx}
      onClick={onClick}
      subtitle={
        <Typography color="text.secondary" noWrap variant="body2">
          {`${ledgerInviteRoleLabels[invite.role]} · ${createdAtLabel}`}
        </Typography>
      }
      title="待接受邀请"
      trailing={<ChevronRightRoundedIcon sx={inviteTrailingIconSx} />}
    />
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700 }} variant="body2">
        {value}
      </Typography>
    </Stack>
  );
}

function findPlaceholder(
  placeholders: LedgerPlaceholderMemberSummary[],
  placeholderId: string | null,
) {
  return placeholderId
    ? (placeholders.find((placeholder) => placeholder.id === placeholderId) ??
        null)
    : null;
}

const feedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

const pendingAvatarSx = {
  bgcolor: "warning.light",
  color: "warning.dark",
};

const inviteAvatarSx = {
  bgcolor: "var(--user-theme-icon-badge-bg)",
  color: "var(--user-theme-icon-badge-color)",
};

const inviteTrailingIconSx = {
  color: "text.secondary",
  flexShrink: 0,
  fontSize: 22,
};

const dialogTitleSx = {
  pr: 6,
};

const dialogCloseSx = {
  color: "text.secondary",
  position: "absolute",
  right: 12,
  top: 10,
};

const detailActionsSx = {
  alignItems: "stretch",
  flexDirection: "column",
  gap: 1,
  px: 3,
  pb: 2.5,
  "& > :not(style) ~ :not(style)": { ml: 0 },
};
