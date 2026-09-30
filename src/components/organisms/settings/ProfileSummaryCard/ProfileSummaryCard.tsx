import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { settingsProfilePageMessages } from "config/settingsMessages";
import { SectionCard } from "molecules/ui/SectionCard";
import { ProfileAvatarUploader } from "organisms/settings/ProfileAvatarUploader/ProfileAvatarUploader";
import { typographyStyles } from "theme/typographyTokens";
import type { AvatarAction } from "types/user";

type ProfileSummaryCardProps = {
  avatarUrl: string | null;
  displayName: string;
  email: string | null;
  updateAvatarAction: AvatarAction;
};

/** 个人主页顶部的头像、昵称与登录邮箱，点击头像可更换。 */
export function ProfileSummaryCard({
  avatarUrl,
  displayName,
  email,
  updateAvatarAction,
}: ProfileSummaryCardProps) {
  return (
    <SectionCard
      component="section"
      aria-label={settingsProfilePageMessages.summaryLabel}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <ProfileAvatarUploader
          action={updateAvatarAction}
          avatarUrl={avatarUrl}
          displayName={displayName}
        />
        <Stack spacing={0.4} sx={{ minWidth: 0 }}>
          <Typography component="h2" noWrap sx={nameSx}>
            {displayName}
          </Typography>
          {email ? (
            <Typography color="text.secondary" noWrap variant="body2">
              {email}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </SectionCard>
  );
}

const nameSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
};
