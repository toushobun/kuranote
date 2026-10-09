import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UserThemeProvider } from "theme/UserThemeProvider";

import {
  ActionPromptDialog,
  ConfirmationDialog,
  DeleteConfirmationDialog,
  FailureFeedbackDialog,
  OperationFeedback,
  SuccessFeedbackDialog,
} from "./OperationFeedbackDialogs";

const meta = {
  title: "Molecules/UI/OperationFeedbackDialogs",
  decorators: [
    (Story) => (
      <UserThemeProvider>
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

export const OperationFailure: Story = {
  name: "操作反馈（按结果切换成功 / 失败）",
  render: () => (
    <OperationFeedback
      feedback={{
        kind: "failure",
        message: "请稍后再试，或检查网络连接。",
        title: "保存失败",
      }}
      onClose={() => undefined}
    />
  ),
};

export const FailureAboveModal: Story = {
  name: "弹窗保持打开时显示失败反馈",
  render: () => (
    <>
      <ConfirmationDialog
        open
        onCancel={() => undefined}
        onConfirm={() => undefined}
        title="编辑账户"
      />
      <FailureFeedbackDialog
        open
        onClose={() => undefined}
        title="账户操作失败"
        description="请修改账户名称后重试。"
      />
    </>
  ),
};

export const DeleteConfirmation: Story = {
  name: "删除确认",
  render: () => (
    <DeleteConfirmationDialog
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
        <Box
          aria-hidden="true"
          sx={{
            bgcolor: "var(--user-theme-badge-bg)",
            borderRadius: "50%",
            height: 72,
            width: 72,
          }}
        />
      }
      onCancel={() => undefined}
      onConfirm={() => undefined}
      open
      title="继续这个操作？"
    />
  ),
};

export const ActionPrompt: StoryObj<typeof ActionPromptDialog> = {
  name: "主按钮 + 文字按钮提示",
  args: {
    description:
      "目前的进度已保存。账本会显示为「创建中」，你可以随时回来继续完成。",
    icon: <BookmarkRoundedIcon />,
    onClose: () => undefined,
    onPrimary: () => undefined,
    onSecondary: () => undefined,
    open: true,
    primaryLabel: "继续创建",
    secondaryLabel: "稍后再说",
    title: "稍后再继续？",
  },
  render: (args) => <ActionPromptDialog {...args} />,
};

export const ActionPromptWithExtraAction: StoryObj<typeof ActionPromptDialog> =
  {
    ...ActionPrompt,
    name: "带附加操作的提示",
    args: {
      ...ActionPrompt.args,
      extraAction: (
        <Box sx={{ mt: 1 }}>
          <Button onClick={() => undefined}>其他操作</Button>
        </Box>
      ),
    },
  };

export const ActionPromptDisabled: StoryObj<typeof ActionPromptDialog> = {
  ...ActionPrompt,
  name: "提示操作处理中",
  args: {
    ...ActionPrompt.args,
    disabled: true,
    description: "正在处理，请稍候。",
  },
};
