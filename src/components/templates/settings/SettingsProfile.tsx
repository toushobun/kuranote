"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Link from "next/link";
import { useState } from "react";

import { routePaths } from "config/paths";
import {
  settingsProfileEntryMessages as entryText,
  settingsProfilePageMessages as pageText,
} from "config/settingsMessages";
import type { UserLedgerDisplayName } from "internal/user";
import { ProfileNicknameDialog } from "organisms/settings/ProfileNicknameDialog/ProfileNicknameDialog";
import { ProfilePasswordDialog } from "organisms/settings/ProfilePasswordDialog/ProfilePasswordDialog";
import { ProfileSummaryCard } from "organisms/settings/ProfileSummaryCard/ProfileSummaryCard";
import {
  SettingsComingSoonToast,
  SettingsEntryButton,
  SettingsEntryGroupCard,
} from "organisms/settings/SettingsEntryList/SettingsEntryList";
import type { ServerAction } from "types/actions";
import type { ChangePasswordAction, PasswordChangeOtpAction } from "types/auth";
import type { AvatarAction, DisplayNameAction } from "types/user";
import { PageHeader } from "templates/layout/PageHeader";
import { PageShell } from "templates/layout/PageShell";

type SettingsProfileTemplateProps = {
  changePasswordAction: ChangePasswordAction;
  currentLedgerId: string | null;
  ledgers: readonly UserLedgerDisplayName[];
  logoutAction: ServerAction;
  profile: {
    avatarUrl: string | null;
    displayName: string;
    email: string | null;
  };
  requestPasswordChangeOtpAction: PasswordChangeOtpAction;
  updateAvatarAction: AvatarAction;
  updateDisplayNameAction: DisplayNameAction;
};

export function SettingsProfileTemplate({
  changePasswordAction,
  currentLedgerId,
  ledgers,
  logoutAction,
  profile,
  requestPasswordChangeOtpAction,
  updateAvatarAction,
  updateDisplayNameAction,
}: SettingsProfileTemplateProps) {
  const [isNicknameDialogOpen, setIsNicknameDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const showComingSoonToast = () => setIsToastOpen(true);

  return (
    <PageShell maxWidth="sm">
      <PageHeader
        leading={
          <IconButton
            aria-label={pageText.backToSettings}
            component={Link}
            href={routePaths.settings}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        }
        subtitle={pageText.subtitle}
        title={pageText.title}
        variant="compact"
      />

      <Stack spacing={1.25} sx={{ mt: 3 }}>
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
          <SettingsEntryButton
            icon={LinkRoundedIcon}
            isLast
            label={entryText.accountBinding}
            onClick={showComingSoonToast}
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
      <SettingsComingSoonToast
        onClose={() => setIsToastOpen(false)}
        open={isToastOpen}
      />
    </PageShell>
  );
}
