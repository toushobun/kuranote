import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  profileFixture,
  succeededAvatarAction,
} from "test/userProfileFixtures";

import { ProfileSummaryCard } from "./ProfileSummaryCard";

const meta = {
  title: "Organisms/Settings/ProfileSummaryCard",
  component: ProfileSummaryCard,
  args: { ...profileFixture, updateAvatarAction: succeededAvatarAction },
} satisfies Meta<typeof ProfileSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutAvatar: Story = {
  name: "无头像（显示昵称首字）",
};

export const WithAvatar: Story = {
  name: "有头像",
  args: {
    avatarUrl: "https://avatars.githubusercontent.com/u/92347214?v=4",
  },
};
