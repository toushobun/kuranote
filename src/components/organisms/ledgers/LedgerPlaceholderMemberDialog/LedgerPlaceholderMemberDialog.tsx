"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { placeholderMemberText as text } from "config/placeholderMemberText";
import { LedgerPlaceholderNameField } from "molecules/ledgers/LedgerPlaceholderNameField";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import {
  ledgerInviteRoleLabels,
  type LedgerPlaceholderMemberActions,
  type PendingLedgerInvite,
} from "types/ledgers";
import {
  formatInviteCreatedAt,
  type LedgerPlaceholderMemberRowView,
} from "utils/ledgerMembers";

import { useLedgerPlaceholderMemberDialog } from "./useLedgerPlaceholderMemberDialog";

type LedgerPlaceholderMemberDialogProps = {
  /** 为 null 时只读：不提供改名、删除和邀请入口。 */
  actions: LedgerPlaceholderMemberActions | null;
  ledgerId: string;
  onClose: () => void;
  onCreateInvite: (placeholderId: string) => void;
  onOpenInvite: (invite: PendingLedgerInvite) => void;
  open: boolean;
  /** 当前查看的待邀请成员行；删除成功后为 null。 */
  row: LedgerPlaceholderMemberRowView | null;
};

/**
 * 待邀请成员的详情弹框。只提供占位需要的改名、专属链接（查看 / 生成）与删除入口，
 * 不提供改角色、记账人、颜色等真实成员功能。新增待邀请成员统一走「邀请成员」
 * 入口（#809）。弹框关闭后仍保持挂载，以便展示 Action 结果反馈。
 */
export function LedgerPlaceholderMemberDialog({
  actions,
  ledgerId,
  onClose,
  onCreateInvite,
  onOpenInvite,
  open,
  row,
}: LedgerPlaceholderMemberDialogProps) {
  const {
    closeFeedback,
    deleting,
    feedback,
    renameAction,
    renaming,
    requestDelete,
  } = useLedgerPlaceholderMemberDialog({ actions, ledgerId, onClose });
  const canManage = actions !== null;
  const invite = row?.invite ?? null;
  const isOpen = open && row !== null;

  return (
    <>
      <Dialog fullWidth maxWidth="xs" onClose={onClose} open={isOpen}>
        <DialogTitle sx={dialogTitleSx}>
          {text.detailDialogTitle}
          <IconButton
            aria-label={text.close}
            onClick={onClose}
            sx={dialogCloseSx}
            type="button"
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {row ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography noWrap sx={nameSx}>
                  {row.placeholder.displayName}
                </Typography>
                <Chip
                  label={
                    !canManage
                      ? text.pendingLabel
                      : invite
                        ? text.statusLinkPending
                        : text.statusNoLink
                  }
                  size="small"
                />
              </Stack>

              {canManage ? (
                <Stack
                  action={renameAction}
                  component="form"
                  key={row.placeholder.id}
                  spacing={1.25}
                >
                  <input name="ledgerId" type="hidden" value={ledgerId} />
                  <input
                    name="placeholderId"
                    type="hidden"
                    value={row.placeholder.id}
                  />
                  <LedgerPlaceholderNameField
                    defaultValue={row.placeholder.displayName}
                    label={text.renameLabel}
                  />
                  <SubmitButton label={text.renameSave} pending={renaming} />
                </Stack>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  {text.readOnlyNote}
                </Typography>
              )}

              <NotMemberNote />

              {canManage ? (
                <>
                  <Divider />
                  <Stack spacing={1.25}>
                    <Typography sx={sectionTitleSx}>
                      {text.inviteSectionTitle}
                    </Typography>
                    {invite ? (
                      <>
                        <Typography color="text.secondary" variant="body2">
                          {`${text.statusLinkPending} · ${ledgerInviteRoleLabels[invite.role]} · ${formatInviteCreatedAt(invite.createdAt)}`}
                        </Typography>
                        <Button
                          fullWidth
                          onClick={() => onOpenInvite(invite)}
                          startIcon={<LinkRoundedIcon />}
                          type="button"
                          variant="outlined"
                        >
                          {text.viewInvite}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography color="text.secondary" variant="body2">
                          {text.generateInviteDescription}
                        </Typography>
                        <Button
                          fullWidth
                          onClick={() => onCreateInvite(row.placeholder.id)}
                          startIcon={<LinkRoundedIcon />}
                          type="button"
                          variant="contained"
                        >
                          {text.generateInvite}
                        </Button>
                      </>
                    )}
                  </Stack>
                  <Divider />
                  <Button
                    color="error"
                    disabled={deleting}
                    fullWidth
                    onClick={() => void requestDelete(row.placeholder)}
                    startIcon={
                      deleting ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : (
                        <DeleteOutlineRoundedIcon />
                      )
                    }
                    type="button"
                    variant="outlined"
                  >
                    {text.deleteAction}
                  </Button>
                </>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>

      <SuccessFeedbackDialog
        aboveModal
        bottomOffset={feedbackBottomOffset}
        onClose={closeFeedback}
        open={feedback?.kind === "success"}
        title={feedback?.kind === "success" ? feedback.title : ""}
      />
      <FailureFeedbackDialog
        aboveModal
        bottomOffset={feedbackBottomOffset}
        description={feedback?.kind === "failure" ? feedback.message : ""}
        onClose={closeFeedback}
        open={feedback?.kind === "failure"}
        title={feedback?.kind === "failure" ? feedback.title : ""}
      />
    </>
  );
}

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button
      disabled={pending}
      fullWidth
      startIcon={
        pending ? <CircularProgress color="inherit" size={18} /> : undefined
      }
      type="submit"
      variant="contained"
    >
      {label}
    </Button>
  );
}

function NotMemberNote() {
  return (
    <Stack direction="row" spacing={0.75} sx={noteSx}>
      <InfoOutlinedIcon fontSize="small" />
      <Typography color="text.secondary" variant="body2">
        {text.notMemberNote}
      </Typography>
    </Stack>
  );
}

const feedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

const dialogTitleSx = {
  pr: 6,
};

const dialogCloseSx = {
  color: "text.secondary",
  position: "absolute",
  right: 12,
  top: 10,
};

const nameSx = {
  fontSize: 20,
  fontWeight: 900,
  minWidth: 0,
};

const sectionTitleSx = {
  fontWeight: 800,
};

const noteSx = {
  alignItems: "flex-start",
  color: "var(--user-theme-action-text)",
};
