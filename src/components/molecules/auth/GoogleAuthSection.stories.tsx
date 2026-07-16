import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GoogleAuthSection } from "./GoogleAuthSection";

const meta = {
  title: "Molecules/Auth/GoogleAuthSection",
  component: GoogleAuthSection,
  args: {
    action: async () => {},
  },
} satisfies Meta<typeof GoogleAuthSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认",
};

export const WithError: Story = {
  name: "含 OAuth 错误提示",
  args: {
    errorMessage: "Google 登录未完成，请重新尝试或改用邮箱方式。",
  },
};

export const ErrorOnly: Story = {
  name: "入口关闭后仅显示错误",
  args: {
    action: undefined,
    errorMessage: "暂时无法连接 Google，请稍后重试或改用邮箱方式。",
  },
};
