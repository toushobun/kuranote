import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import {
  SettingsEntryButton,
  SettingsEntryGroupCard,
  SettingsExpandableEntry,
} from "./SettingsEntryList";

const meta = {
  title: "Organisms/Settings/SettingsEntryList",
  component: SettingsEntryGroupCard,
  args: {
    children: null,
    label: "设置项",
  },
} satisfies Meta<typeof SettingsEntryGroupCard>;

export default meta;
type Story = StoryObj<typeof meta>;

function SettingsEntryListPreview() {
  const [expanded, setExpanded] = useState(true);

  return (
    <SettingsEntryGroupCard label="设置项">
      <SettingsEntryButton
        href="/ledgers"
        icon={MenuBookOutlinedIcon}
        isLast={false}
        label="账本管理"
        trailing="家庭账本"
      />
      <SettingsExpandableEntry
        expanded={expanded}
        icon={PaletteOutlinedIcon}
        isLast={false}
        label="主题换装"
        onToggle={() => setExpanded((current) => !current)}
      >
        <Typography variant="body2">展开后的面板内容</Typography>
      </SettingsExpandableEntry>
      <SettingsEntryButton
        icon={LanguageOutlinedIcon}
        isLast={false}
        label="语言设置"
        trailing="简体中文"
      />
      <SettingsEntryButton
        icon={LogoutRoundedIcon}
        isLast
        label="退出登录"
        tone="danger"
      />
    </SettingsEntryGroupCard>
  );
}

export const Default: Story = {
  name: "设置入口列表 / 链接、展开、准备中、危险操作",
  render: () => <SettingsEntryListPreview />,
};
