import Typography from "@mui/material/Typography";

import { UserThemePicker } from "molecules/theme/UserThemePicker";
import { PageCard } from "molecules/ui/PageCard";
import { typographyStyles } from "theme/typographyTokens";

export function SettingsThemeSection() {
  return (
    <PageCard sx={{ p: { xs: 3, sm: 4 } }}>
      <Typography component="h2" variant="h6" sx={settingsTitleSx}>
        个人主题
      </Typography>
      <Typography color="text.secondary" sx={settingsDescriptionSx}>
        只影响当前登录用户看到的界面氛围，不会改变账本成员显示色。
      </Typography>
      <UserThemePicker />
    </PageCard>
  );
}

const settingsTitleSx = {
  ...typographyStyles.cardTitle,
};

const settingsDescriptionSx = {
  ...typographyStyles.settingEntry,
  mb: 3,
  mt: 1,
};
