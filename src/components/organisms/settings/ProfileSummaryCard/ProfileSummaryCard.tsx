import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { settingsProfilePageMessages } from "config/settingsMessages";
import { SectionCard } from "molecules/ui/SectionCard";
import { typographyStyles } from "theme/typographyTokens";

type ProfileSummaryCardProps = {
  avatarUrl: string | null;
  displayName: string;
  email: string | null;
};

/** 取昵称首字作为无头像时的占位，兼容 emoji 等代理对字符。 */
export function getDisplayNameInitial(displayName: string): string {
  return (Array.from(displayName.trim())[0] ?? "").toUpperCase();
}

/** 个人主页顶部的头像、昵称与登录邮箱，只展示不提供更换入口。 */
export function ProfileSummaryCard({
  avatarUrl,
  displayName,
  email,
}: ProfileSummaryCardProps) {
  return (
    <SectionCard
      component="section"
      aria-label={settingsProfilePageMessages.summaryLabel}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Avatar alt={displayName} src={avatarUrl ?? undefined} sx={avatarSx}>
          {getDisplayNameInitial(displayName)}
        </Avatar>
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

const avatarSx = {
  bgcolor: "var(--user-theme-icon-badge-bg)",
  color: "var(--user-theme-icon-badge-color)",
  flexShrink: 0,
  fontSize: 24,
  fontWeight: 700,
  height: 64,
  width: 64,
};

const nameSx = {
  ...typographyStyles.cardTitle,
  fontSize: 20,
};
