"use client";

import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useState } from "react";

import { routePaths } from "config/paths";
import {
  settingsProfileEntryMessages as entryText,
  settingsProfilePageMessages as pageText,
} from "config/settingsMessages";
import type {
  GoogleIdentityLinkFeedback,
  GoogleIdentityStatus,
} from "internal/auth";
import type { UserLedgerDisplayName } from "internal/user";
import { ProfileAccountLinking } from "organisms/settings/ProfileAccountLinking/ProfileAccountLinking";
import { ProfileNicknameDialog } from "organisms/settings/ProfileNicknameDialog/ProfileNicknameDialog";
import { ProfilePasswordDialog } from "organisms/settings/ProfilePasswordDialog/ProfilePasswordDialog";
import { ProfileSummaryCard } from "organisms/settings/ProfileSummaryCard/ProfileSummaryCard";
import {
  SettingsEntryButton,
  SettingsEntryGroupCard,
} from "organisms/settings/SettingsEntryList/SettingsEntryList";
import type { ServerAction } from "types/actions";
import type {
  ChangePasswordAction,
  GoogleIdentityLinkAction,
  PasswordChangeOtpAction,
} from "types/auth";
import type { AvatarAction, DisplayNameAction } from "types/user";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";

type SettingsProfileTemplateProps = {
  changePasswordAction: ChangePasswordAction;
  currentLedgerId: string | null;
  googleIdentity: GoogleIdentityStatus;
  googleIdentityLinkFeedback: GoogleIdentityLinkFeedback | null;
  ledgers: readonly UserLedgerDisplayName[];
  linkGoogleIdentityAction: GoogleIdentityLinkAction;
  logoutAction: ServerAction;
  profile: {
    avatarUrl: string | null;
    displayName: string;
    email: string | null;
  };
  requestPasswordChangeOtpAction: PasswordChangeOtpAction;
  unlinkGoogleIdentityAction: GoogleIdentityLinkAction;
  updateAvatarAction: AvatarAction;
  updateDisplayNameAction: DisplayNameAction;
};

export function SettingsProfileTemplate({
  changePasswordAction,
  currentLedgerId,
  googleIdentity,
  googleIdentityLinkFeedback,
  ledgers,
  linkGoogleIdentityAction,
  logoutAction,
  profile,
  requestPasswordChangeOtpAction,
  unlinkGoogleIdentityAction,
  updateAvatarAction,
  updateDisplayNameAction,
}: SettingsProfileTemplateProps) {
  const [isNicknameDialogOpen, setIsNicknameDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <SettingsPageLayout
      back={{ href: routePaths.settings, label: pageText.backToSettings }}
      subtitle={pageText.subtitle}
      title={pageText.title}
    >
      <Stack spacing={1.25}>
        <ProfileSummaryCard
          avatarUrl={profile.avatarUrl}
          displayName={profile.displayName}
          email={profile.email}
          updateAvatarAction={updateAvatarAction}
        />

        <SettingsEntryGroupCard label={pageText.profileGroupLabel}>
          <SettingsEntryButton
            icon={BadgeOutlinedIcon}
            isLast
            label={entryText.nickname}
            onClick={() => setIsNicknameDialogOpen(true)}
            trailing={profile.displayName}
          />
        </SettingsEntryGroupCard>

        <SettingsEntryGroupCard label={pageText.securityGroupLabel}>
          <SettingsEntryButton
            icon={LockOutlinedIcon}
            isLast={false}
            label={entryText.password}
            onClick={() => setIsPasswordDialogOpen(true)}
          />
          <ProfileAccountLinking
            googleIdentity={googleIdentity}
            isLast
            linkAction={linkGoogleIdentityAction}
            linkFeedback={googleIdentityLinkFeedback}
            unlinkAction={unlinkGoogleIdentityAction}
          />
        </SettingsEntryGroupCard>

        <SettingsEntryGroupCard label={pageText.accountActionsGroupLabel}>
          <Box component="form" action={logoutAction} sx={{ m: 0 }}>
            <SettingsEntryButton
              icon={LogoutRoundedIcon}
              isLast
              label={entryText.logout}
              tone="danger"
              type="submit"
            />
          </Box>
        </SettingsEntryGroupCard>
      </Stack>

      <ProfileNicknameDialog
        action={updateDisplayNameAction}
        currentDisplayName={profile.displayName}
        currentLedgerId={currentLedgerId}
        ledgers={ledgers}
        onClose={() => setIsNicknameDialogOpen(false)}
        open={isNicknameDialogOpen}
      />
      <ProfilePasswordDialog
        changePasswordAction={changePasswordAction}
        email={profile.email}
        onClose={() => setIsPasswordDialogOpen(false)}
        open={isPasswordDialogOpen}
        requestOtpAction={requestPasswordChangeOtpAction}
      />
    </SettingsPageLayout>
  );
}
