"use client";

import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
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

import { LedgerInviteRoleRow } from "molecules/ledgers/LedgerInviteRoleRow";
import { ListRowButton } from "molecules/ui/ListRowButton";
import { SuccessFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import type { ServerAction } from "types/actions";

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
  const [token, setToken] = useState<string | null>(initialToken);
  const [open, setOpen] = useState(
    errorMessage !== null || initialToken !== null,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashToken = hashParams.get("inviteToken");
    if (!hashToken) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端挂载后读取 URL fragment 中的邀请 token，避免服务端水合差异。
    setToken(hashToken);
    setOpen(true);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }, []);

  const invitePath = token ? `/invite/${encodeURIComponent(token)}` : "";
  const displayedLink = useMemo(() => {
    if (!invitePath) return "生成后将在这里显示邀请链接";
    if (typeof window === "undefined") return invitePath;
    return `${window.location.origin}${invitePath}`;
  }, [invitePath]);

  async function copyLink() {
    if (!invitePath) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}${invitePath}`,
    );
    setCopied(true);
  }

  return (
    <>
      <ListRowButton
        avatar={<PeopleAltRoundedIcon />}
        avatarSx={inviteAvatarSx}
        disabled={!canInvite}
        onClick={() => setOpen(true)}
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
        onClose={() => setOpen(false)}
        open={open}
      >
        <form action={action}>
          <DialogTitle sx={dialogTitleSx}>
            邀请成员
            <IconButton
              aria-label="关闭"
              onClick={() => setOpen(false)}
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

              <LedgerInviteRoleRow role="member" />

              <input name="ledgerId" type="hidden" value={ledgerId} />

              <TextField
                fullWidth
                label="邀请链接"
                slotProps={{
                  htmlInput: { readOnly: true },
                  input: {
                    endAdornment: token ? (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="复制"
                          edge="end"
                          onClick={copyLink}
                          size="small"
                        >
                          <ContentCopyRoundedIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
                value={displayedLink}
              />

              <Stack spacing={0.75}>
                <Typography color="text.secondary" sx={qrLabelSx}>
                  邀请二维码（即将支持）
                </Typography>
                <Stack
                  aria-label="邀请二维码占位，即将支持"
                  role="img"
                  sx={qrPlaceholderSx}
                >
                  <QrCode2RoundedIcon
                    sx={{ color: "text.disabled", fontSize: 40 }}
                  />
                  <Typography color="text.disabled" variant="caption">
                    即将支持二维码邀请
                  </Typography>
                </Stack>
              </Stack>

              {errorMessage ? (
                <Typography color="error" role="alert" variant="body2">
                  {errorMessage}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            {token ? (
              <Button
                fullWidth
                onClick={copyLink}
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

      <SuccessFeedbackDialog
        bottomOffset={feedbackBottomOffset}
        onClose={() => setCopied(false)}
        open={copied}
        title="已复制邀请链接"
      />
    </>
  );
}

const feedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

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
