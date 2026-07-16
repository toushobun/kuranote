"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
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
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { transactionTimeLocale } from "config/dateTime";
import {
  ledgerInviteErrorOperations,
  type LedgerInviteErrorOperation,
} from "config/paths";
import { LedgerInviteQrCode } from "molecules/ledgers/LedgerInviteQrCode";
import { LedgerInviteRoleRow } from "molecules/ledgers/LedgerInviteRoleRow";
import { ListRowButton } from "molecules/ui/ListRowButton";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { usePendingLedgerInvites } from "organisms/ledgers/LedgerInvitePendingContext";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import type { ServerAction } from "types/actions";
import {
  ledgerInviteRoleLabels,
  type PendingLedgerInvite,
} from "types/ledgers";

import { useLedgerInviteEntry } from "./useLedgerInviteEntry";

type LedgerInviteEntryProps = {
  action: ServerAction;
  canInvite: boolean;
  errorKey?: string | null;
  errorMessage?: string | null;
  errorOperation?: LedgerInviteErrorOperation;
  ledgerId: string;
  ledgerName?: string;
  token?: string | null;
};

export function LedgerInviteEntry({
  action,
  canInvite,
  errorKey = null,
  errorMessage = null,
  errorOperation = ledgerInviteErrorOperations.create,
  ledgerId,
  ledgerName = "当前账本",
  token: initialToken = null,
}: LedgerInviteEntryProps) {
  const pendingInvites = usePendingLedgerInvites();
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
    visibleError,
  } = useLedgerInviteEntry({
    errorKey,
    errorMessage,
    errorOperation,
    initialToken,
    pendingInvites,
  });

  return (
    <>
      {pendingInvites.map((invite) => (
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
        onClick={openNewDraft}
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

      <Dialog fullWidth maxWidth="xs" onClose={closeDraft} open={draftOpen}>
        <form action={action}>
          <DialogTitle sx={dialogTitleSx}>
            邀请成员
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
                邀请家人、伴侣或朋友加入当前账本，共同记账。
              </Typography>

              <LedgerInviteRoleRow
                onChange={draftToken ? undefined : setDraftRole}
                role={draftRole}
              />
              <input name="ledgerId" type="hidden" value={ledgerId} />
              <input name="role" type="hidden" value={draftRole} />

              <InviteLinkField link={draftLink} onCopy={copyLink} />
              <LedgerInviteQrCode ledgerName={ledgerName} link={draftLink} />

              {visibleError ? (
                <Typography color="error" role="alert" variant="body2">
                  {visibleError}
                </Typography>
              ) : null}
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
                  <InviteLinkField link={selectedLink} onCopy={copyLink} />
                  <LedgerInviteQrCode
                    ledgerName={ledgerName}
                    link={selectedLink}
                  />
                </>
              ) : (
                <>
                  <Typography color="text.secondary" variant="body2">
                    为保护邀请安全，刷新后无法再次读取原链接。可以重新生成链接，旧链接会立即失效。
                  </Typography>
                  <LedgerInviteQrCode
                    emptyMessage="原邀请链接不可读取，无法显示二维码"
                    ledgerName={ledgerName}
                    link=""
                  />
                </>
              )}
            </Stack>
          ) : null}
        </DialogContent>
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
          ) : canInvite && selectedInvite ? (
            <form action={action} style={{ width: "100%" }}>
              <input name="intent" type="hidden" value="replace" />
              <input name="ledgerId" type="hidden" value={ledgerId} />
              <input name="inviteId" type="hidden" value={selectedInvite.id} />
              <Button fullWidth type="submit" variant="contained">
                重新生成链接
              </Button>
            </form>
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
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={closeRevokeConfirm}
        open={revokeConfirmOpen}
      >
        <form action={action}>
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
          managementError?.operation === ledgerInviteErrorOperations.replace
            ? "重新生成邀请链接失败"
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

function InviteLinkField({
  link,
  onCopy,
}: {
  link: string;
  onCopy: (link: string) => void;
}) {
  return (
    <TextField
      fullWidth
      label="邀请链接"
      slotProps={{
        htmlInput: { readOnly: true },
        input: {
          endAdornment: link ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="复制"
                edge="end"
                onClick={() => onCopy(link)}
                size="small"
                type="button"
              >
                <ContentCopyRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      value={link || "生成后将在这里显示邀请链接"}
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

function formatInviteCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已创建";

  return new Intl.DateTimeFormat(transactionTimeLocale, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
  }).format(date);
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