import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  failedAvatarAction,
  succeededAvatarAction,
} from "test/userProfileFixtures";

import { ProfileAvatarUploader } from "./ProfileAvatarUploader";

const meta = {
  title: "Organisms/Settings/ProfileAvatarUploader",
  component: ProfileAvatarUploader,
  args: {
    action: succeededAvatarAction,
    avatarUrl: null,
    displayName: "淞文",
  },
} satisfies Meta<typeof ProfileAvatarUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutAvatar: Story = {
  name: "无头像（点击选择图片后上传成功）",
};

export const WithAvatar: Story = {
  name: "有头像",
  args: {
    avatarUrl: "https://avatars.githubusercontent.com/u/92347214?v=4",
  },
};

export const UploadFailed: Story = {
  name: "上传失败",
  args: { action: failedAvatarAction },
};
