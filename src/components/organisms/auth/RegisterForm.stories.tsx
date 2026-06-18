import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { createMockTurnstileAdapter } from "./mockTurnstile";
import { RegisterForm } from "./RegisterForm";

const demoPassword = "abc12345";

async function requestOtpAction() {
  return {
    status: "success" as const,
    success: "如果该邮箱可以注册，我们已发送验证码。请查收邮件。",
  };
}

async function submitOtpAction() {
  return {};
}

async function submitOtpErrorAction() {
  return {
    error: "验证码不正确或已过期，请重新获取",
    remainingAttempts: 4,
    status: "otp_invalid" as const,
  };
}

const meta: Meta<typeof RegisterForm> = {
  title: "Organisms/Auth/RegisterForm",
  component: RegisterForm,
  args: {
    requestOtpAction,
    submitOtpAction,
    turnstileAdapter: createMockTurnstileAdapter(),
    turnstileSiteKey: "test-site-key",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认",
};

export const OtpInput: Story = {
  name: "输入验证码",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/邮箱/), "new@example.test");
    await userEvent.type(canvas.getByLabelText(/昵称/), "山田太郎");
    await userEvent.type(canvas.getByLabelText(/^密码/), demoPassword);
    await userEvent.type(canvas.getByLabelText(/确认密码/), demoPassword);
    await userEvent.click(canvas.getByRole("button", { name: "通过人机验证" }));
    await userEvent.click(canvas.getByRole("button", { name: "获取验证码" }));
  },
};

export const OtpError: Story = {
  name: "验证码错误",
  args: {
    submitOtpAction: submitOtpErrorAction,
  },
  play: async (context) => {
    await OtpInput.play?.(context);

    const canvas = within(context.canvasElement);
    await userEvent.type(canvas.getByLabelText(/验证码/), "000000");
    await userEvent.click(canvas.getByRole("button", { name: "完成注册" }));
  },
};

export const ValidationErrors: Story = {
  name: "字段校验错误",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/邮箱/), "not-email");
    await userEvent.type(canvas.getByLabelText(/昵称/), "名".repeat(51));
    await userEvent.type(canvas.getByLabelText(/^密码/), "abc");
    await userEvent.type(canvas.getByLabelText(/确认密码/), "different");
  },
};
