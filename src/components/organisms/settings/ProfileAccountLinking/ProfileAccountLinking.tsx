"use client";

import GoogleIcon from "@mui/icons-material/Google";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  profileAccountLinkingMessages as text,
  settingsProfileEntryMessages as entryText,
} from "config/settingsMessages";
import type {
  GoogleIdentityLinkFeedback,
  GoogleIdentityStatus,
} from "internal/auth";
import { OperationFeedback } from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import { SettingsExpandableEntry } from "organisms/settings/SettingsEntryList/SettingsEntryList";
import type { GoogleIdentityLinkAction } from "types/auth";

import { useProfileAccountLinking } from "./useProfileAccountLinking";

type ProfileAccountLinkingProps = {
  googleIdentity: GoogleIdentityStatus;
  isLast: boolean;
  linkAction: GoogleIdentityLinkAction;
  linkFeedback: GoogleIdentityLinkFeedback | null;
  unlinkAction: GoogleIdentityLinkAction;
};

/**
 * 个人主页「账号绑定」展开区域，目前只支持 Google。
 * 绑定状态由服务端读取后传入；反馈弹框放在展开区域外，收起后仍可展示结果。
 */
export function ProfileAccountLinking({
  googleIdentity,
  isLast,
  linkAction,
  linkFeedback,
  unlinkAction,
}: ProfileAccountLinkingProps) {
  const googleEmail = googleIdentity.linked ? googleIdentity.email : null;
  const unlinkDisabledReason = googleIdentity.linked
    ? googleIdentity.unlinkDisabledReason
    : null;
  const linking = useProfileAccountLinking({
    googleEmail,
    linkAction,
    linkFeedback,
    unlinkAction,
  });

  return (
    <>
      <SettingsExpandableEntry
        expanded={linking.expanded}
        icon={LinkRoundedIcon}
        isLast={isLast}
        label={entryText.accountBinding}
        onToggle={linking.toggleExpanded}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} sx={providerRowSx}>
            <GoogleIcon color="action" fontSize="small" />
            <Box sx={providerTextSx}>
              <Typography variant="body2">{text.google}</Typography>
              <Typography
                color="text.secondary"
                sx={statusTextSx}
                variant="caption"
              >
                {googleIdentity.linked
                  ? text.linkedStatus(googleEmail)
                  : text.unlinkedStatus}
              </Typography>
            </Box>
            {googleIdentity.linked ? (
              <Button
                color="error"
                disabled={unlinkDisabledReason !== null || linking.pending}
                onClick={linking.unlink}
                size="small"
                startIcon={
                  linking.isUnlinking ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : undefined
                }
                variant="outlined"
              >
                {text.unlink}
              </Button>
            ) : (
              <Button
                disabled={linking.pending}
                onClick={linking.link}
                size="small"
                startIcon={
                  linking.isLinking ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : undefined
                }
                variant="contained"
              >
                {text.link}
              </Button>
            )}
          </Stack>
          {unlinkDisabledReason ? (
            <Typography color="text.secondary" variant="caption">
              {unlinkDisabledReason}
            </Typography>
          ) : null}
        </Stack>
      </SettingsExpandableEntry>

      <OperationFeedback
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        feedback={linking.feedback}
        onClose={linking.closeFeedback}
      />
    </>
  );
}

const providerRowSx = {
  alignItems: "center",
};

const providerTextSx = {
  flex: 1,
  minWidth: 0,
};

const statusTextSx = {
  display: "block",
  overflowWrap: "anywhere",
};
