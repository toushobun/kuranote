import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UserThemeProvider } from "theme/UserThemeProvider";

import {
  ConfirmationDialog,
  FailureFeedbackDialog,
  SuccessFeedbackDialog,
} from "./OperationFeedbackDialogs";

const meta = {
  title: "Molecules/UI/OperationFeedbackDialogs",
  decorators: [
    (Story) => (
      <UserThemeProvider storageScope="storybook-operation-feedback-dialog">
        <Story />
      </UserThemeProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  name: "成功反馈",
  render: () => (
    <SuccessFeedbackDialog
      description="这条记录已经保存，可以继续记录生活。"
      onClose={() => undefined}
      open
      title="保存成功"
    />
  ),
};

export const Failure: Story = {
  name: "失败反馈",
  render: () => (
    <FailureFeedbackDialog
      description="请稍后再试，或检查网络连接。"
      onClose={() => undefined}
      open
      title="保存失败"
    />
  ),
};

export const DeleteConfirmation: Story = {
  name: "删除确认",
  render: () => (
    <ConfirmationDialog
      confirmColor="error"
      confirmLabel="删除"
      description="删除后无法恢复。"
      onCancel={() => undefined}
      onConfirm={() => undefined}
      open
      title="确认删除这条记录？"
    />
  ),
};

export const CustomConfirmation: Story = {
  name: "自定义确认内容",
  render: () => (
    <ConfirmationDialog
      cancelLabel="稍后再说"
      confirmLabel="继续"
      description="确认后会进入下一步。"
      illustration={
        <div aria-hidden="true" style={{ fontSize: 72 }}>
          🐾
        </div>
      }
      onCancel={() => undefined}
      onConfirm={() => undefined}
      open
      title="继续这个操作？"
    />
  ),
};
