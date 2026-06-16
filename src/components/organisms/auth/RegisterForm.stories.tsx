import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { RegisterForm } from "./RegisterForm";

const meta: Meta<typeof RegisterForm> = {
  title: "Organisms/Auth/RegisterForm",
  component: RegisterForm,
  args: {
    action: async () => ({}),
    validateEmailFormatAction: async () => ({
      success: "该邮箱格式可以使用。",
    }),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认",
};

export const WithError: Story = {
  name: "含注册失败提示",
  args: {
    action: async () => ({ error: "注册失败，请确认邮箱和密码后再试。" }),
  },
};

export const WithSuccess: Story = {
  name: "含注册成功提示",
  args: {
    action: async () => ({
      success: "注册申请已提交。请查收确认邮件后再登录。",
    }),
  },
};

export const EmailCheckSuccess: Story = {
  name: "邮箱格式校验成功",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/邮箱/), "new@example.test");
    await userEvent.click(canvas.getByRole("button", { name: "校验" }));
  },
};

export const EmailCheckError: Story = {
  name: "邮箱格式错误",
  args: {
    validateEmailFormatAction: async () => ({
      error: "邮箱格式有误",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/邮箱/), "not-email");
    await userEvent.click(canvas.getByRole("button", { name: "校验" }));
  },
};

export const WithValidationErrors: Story = {
  name: "字段校验错误",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/邮箱/), "not-email");
    await userEvent.tab();
    await userEvent.type(canvas.getByLabelText(/昵称/), "名".repeat(51));
    await userEvent.tab();
    await userEvent.type(canvas.getByLabelText(/^密码/), "password");
    await userEvent.tab();
    await userEvent.type(canvas.getByLabelText(/确认密码/), "different");
    await userEvent.tab();
  },
};
