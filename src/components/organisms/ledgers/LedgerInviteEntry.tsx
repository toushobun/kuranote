"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
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
import { useEffect, useMemo, useState } from "react";

import { transactionTimeLocale } from "config/dateTime";
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
  isLedgerInviteRole,
  ledgerInviteRoleLabels,
  type LedgerInviteRole,
  type PendingLedgerInvite,
} from "types/ledgers";

type LedgerInviteEntryProps = {
  action: ServerAction;
  canInvite: boolean;
  errorMessage?: string | null;
  ledgerId: string;
  token?: string | null;
};

export function LedgerInviteEntry({
  action,
  canInvite,
  errorMessage = null,
  ledgerId,
  token: initialToken = null,
}: LedgerInviteEntryProps) {
  const pendingInvites = usePendingLedgerInvites();
  const [draftOpen, setDraftOpen] = useState(
    errorMessage !== null || initialToken !== null,
  );
  const [draftRole, setDraftRole] = useState<LedgerInviteRole>("member");
  const [draftToken, setDraftToken] = useState<string | null>(initialToken);
  const [visibleError, setVisibleError] = useState(errorMessage);
  const [sessionTokens, setSessionTokens] = useState<Record<string, string>>(
    {},
  );
  const [selectedInvite, setSelectedInvite] =
    useState<PendingLedgerInvite | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [created, setCreated] = useState(false);
  const [revoked, setRevoked] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashInviteId = hashParams.get("inviteId");
    const hashRole = hashParams.get("inviteRole");
    const hashToken = hashParams.get("inviteToken");
    const url = new URL(window.location.href);
    const inviteResult = url.searchParams.get("inviteResult");
    const hasInviteError = url.searchParams.has("inviteError");

    if (hashToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端挂载后读取 fragment 中的一次性 token，避免 token 进入服务端日志。
      setDraftToken(hashToken);
      setDraftOpen(true);
      setCreated(true);
    }

    if (hashInviteId && hashToken) {
      setSessionTokens((current) => ({
        ...current,
        [hashInviteId]: hashToken,
      }));
    }

    if (isLedgerInviteRole(hashRole)) {
      setDraftRole(hashRole);
    }

    if (inviteResult === "revoked") {
      setRevoked(true);
      url.searchParams.delete("inviteResult");
    }

    if (hasInviteError) {
      url.searchParams.delete("inviteError");
    }

    if (hashToken || inviteResult === "revoked" || hasInviteError) {
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  }, []);

  const draftLink = useInviteLink(draftToken);
  const selectedToken = selectedInvite
    ? (sessionTokens[selectedInvite.id] ?? null)
    : null;
  const selectedLink = useInviteLink(selectedToken);

  function openNewDraft() {
    setDraftRole("member");
    setDraftToken(null);
    setVisibleError(null);
    setCopied(false);
    setCopyFailed(false);
    setCreated(false);
    setDraftOpen(true);
  }

  async function copyLink(link: string) {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCreated(false);
      setCopyFailed(false);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  return (
    <>
      {pendingInvites.map((invite) => (
        <PendingInviteRow
          invite={invite}
          key={invite.id}
          onClick={() => setSelectedInvite(invite)}
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

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setDraftOpen(false)}
        open={draftOpen}
      >
        <form action={action}>
          <DialogTitle sx={dialogTitleSx}>
            邀请成员
            <IconButton
              aria-label="关闭"
              onClick={() => setDraftOpen(false)}
              sx={dialogCloseSx}
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
              <QrPlaceholder />

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
        onClose={() => setSelectedInvite(null)}
        open={selectedInvite !== null && !revokeConfirmOpen}
      >
        <DialogTitle sx={dialogTitleSx}>
          邀请详情
          <IconButton
            aria-label="关闭邀请详情"
            onClick={() => setSelectedInvite(null)}
            sx={dialogCloseSx}
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
                <InviteLinkField link={selectedLink} onCopy={copyLink} />
              ) : (
                <Typography color="text.secondary" variant="body2">
                  为保护邀请安全，刷新后无法再次读取原链接。可以重新生成链接，旧链接会立即失效。
                </Typography>
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
              onClick={() => setRevokeConfirmOpen(true)}
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
        onClose={() => setRevokeConfirmOpen(false)}
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
            <Button onClick={() => setRevokeConfirmOpen(false)} type="button">
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
        onClose={() => setCopied(false)}
        open={copied}
        title="复制成功"
      />
      <SuccessFeedbackDialog
        aboveModal
        bottomOffset={feedbackBottomOffset}
        onClose={() => setCreated(false)}
        open={created}
        title="创建链接成功，快去复制给你的亲友吧"
      />
      <SuccessFeedbackDialog
        bottomOffset={feedbackBottomOffset}
        description="该邀请链接已失效。"
        onClose={() => setRevoked(false)}
        open={revoked}
        title="邀请已撤销"
      />
      <FailureFeedbackDialog
        aboveModal
        bottomOffset={feedbackBottomOffset}
        onClose={() => setCopyFailed(false)}
        open={copyFailed}
        title="复制失败，请手动复制邀请链接"
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

function QrPlaceholder() {
  return (
    <Stack spacing={0.75}>
      <Typography color="text.secondary" sx={qrLabelSx}>
        邀请二维码（即将支持）
      </Typography>
      <Stack
        aria-label="邀请二维码占位，即将支持"
        role="img"
        sx={qrPlaceholderSx}
      >
        <QrCode2RoundedIcon sx={{ color: "text.disabled", fontSize: 40 }} />
        <Typography color="text.disabled" variant="caption">
          即将支持二维码邀请
        </Typography>
      </Stack>
    </Stack>
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

function useInviteLink(token: string | null) {
  return useMemo(() => {
    if (!token) return "";
    const path = `/invite/${encodeURIComponent(token)}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [token]);
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

const qrLabelSx = {
  fontSize: 13,
  fontWeight: 700,
  px: 0.2,
};

const qrPlaceholderSx = {
  alignItems: "center",
  bgcolor: "action.hover",
  border: "1.5px dashed",
  borderColor: "divider",
  borderRadius: 2,
  gap: 0.5,
  justifyContent: "center",
  minHeight: 132,
  py: 2,
};
