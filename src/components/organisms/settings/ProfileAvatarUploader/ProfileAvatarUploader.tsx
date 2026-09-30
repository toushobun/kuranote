"use client";

import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha, type Theme } from "@mui/material/styles";
import { useRef } from "react";

import { profileAvatarUploaderMessages as text } from "config/settingsMessages";
import {
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import type { AvatarAction } from "types/user";

import { useProfileAvatarUploader } from "./useProfileAvatarUploader";

type ProfileAvatarUploaderProps = {
  action: AvatarAction;
  avatarUrl: string | null;
  displayName: string;
};

/** 取昵称首字作为无头像时的占位，兼容 emoji 等代理对字符。 */
export function getDisplayNameInitial(displayName: string): string {
  return (Array.from(displayName.trim())[0] ?? "").toUpperCase();
}

/** 个人主页头像：点击选择图片，压缩后上传并更换头像。 */
export function ProfileAvatarUploader({
  action,
  avatarUrl,
  displayName,
}: ProfileAvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploader = useProfileAvatarUploader(action, inputRef);

  return (
    <>
      <ButtonBase
        aria-busy={uploader.pending}
        aria-label={uploader.pending ? text.uploading : text.changeAvatar}
        disabled={uploader.pending}
        onClick={uploader.openFilePicker}
        sx={buttonSx}
      >
        <Badge
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          badgeContent={<PhotoCameraRoundedIcon sx={{ fontSize: 14 }} />}
          overlap="circular"
          slotProps={{ badge: { sx: badgeSx } }}
        >
          <Avatar alt={displayName} src={avatarUrl ?? undefined} sx={avatarSx}>
            {getDisplayNameInitial(displayName)}
          </Avatar>
        </Badge>
        {uploader.pending ? (
          <Box sx={progressOverlaySx}>
            <CircularProgress color="inherit" size={28} />
          </Box>
        ) : null}
      </ButtonBase>
      <input
        accept="image/*"
        data-testid="profile-avatar-input"
        hidden
        onChange={uploader.handleFileChange}
        ref={inputRef}
        type="file"
      />

      <SuccessFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        onClose={uploader.closeFeedback}
        open={uploader.feedback?.kind === "success"}
        title={text.successTitle}
      />
      <FailureFeedbackDialog
        bottomOffset={bottomNavigationLayout.feedbackBottomOffset}
        description={
          uploader.feedback?.kind === "failure" ? uploader.feedback.message : ""
        }
        onClose={uploader.closeFeedback}
        open={uploader.feedback?.kind === "failure"}
        title={text.failureTitle}
      />
    </>
  );
}

const avatarSize = 64;

const buttonSx = {
  borderRadius: "50%",
  flexShrink: 0,
  position: "relative",
};

const avatarSx = {
  bgcolor: "var(--user-theme-icon-badge-bg)",
  color: "var(--user-theme-icon-badge-color)",
  fontSize: 24,
  fontWeight: 700,
  height: avatarSize,
  width: avatarSize,
};

const badgeSx = {
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: "50%",
  color: "text.secondary",
  height: 24,
  minWidth: 24,
  p: 0,
};

const progressOverlaySx = {
  alignItems: "center",
  bgcolor: (theme: Theme) => alpha(theme.palette.common.black, 0.4),
  borderRadius: "50%",
  color: "common.white",
  display: "flex",
  inset: 0,
  justifyContent: "center",
  position: "absolute",
};
