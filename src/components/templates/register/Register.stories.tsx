import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RegisterTemplate } from "./Register";

async function requestOtpAction() {
  return {
    status: "success" as const,
    success: "如果该邮箱可以注册，我们已发送验证码。请查收邮件。",
  };
}

async function submitOtpAction() {
  return {};
}

async function requestOtpLimitedAction() {
  return {
    error: "验证码发送过于频繁，请稍后再试",
    resetTurnstile: true,
    retryAfterSeconds: 3,
    status: "rate_limited" as const,
  };
}

const meta = {
  title: "Templates/Register/RegisterTemplate",
  component: RegisterTemplate,
  args: {
    requestOtpAction,
    submitOtpAction,
    turnstileSiteKey: "test-site-key",
  },
} satisfies Meta<typeof RegisterTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "注册页面",
};

export const OtpRequestLimited: Story = {
  name: "获取验证码限流",
  args: {
    requestOtpAction: requestOtpLimitedAction,
  },
};
