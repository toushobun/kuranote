import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RegisterTemplate } from "./Register";

async function defaultAction() {
  return {};
}

async function validateEmailFormatAction() {
  return {
    success: "该邮箱格式可以使用。",
  };
}

async function errorAction() {
  return { error: "注册失败，请确认邮箱和密码后再试。" };
}

async function successAction() {
  return { success: "注册申请已提交。请查收确认邮件后再登录。" };
}

const meta = {
  title: "Templates/Register/RegisterTemplate",
  component: RegisterTemplate,
  args: {
    action: defaultAction,
    validateEmailFormatAction,
  },
} satisfies Meta<typeof RegisterTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "注册页面",
};

export const WithError: Story = {
  name: "含错误提示",
  args: {
    action: errorAction,
  },
};

export const WithSuccess: Story = {
  name: "含成功提示",
  args: {
    action: successAction,
  },
};
