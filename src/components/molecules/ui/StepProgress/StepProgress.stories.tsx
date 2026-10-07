import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { UserThemeProvider } from "theme/UserThemeProvider";

import { StepProgress } from "./StepProgress";

const meta = {
  title: "Molecules/UI/StepProgress",
  component: StepProgress,
  decorators: [
    (Story) => (
      <UserThemeProvider>
        <div style={{ maxWidth: 420 }}>
          <Story />
        </div>
      </UserThemeProvider>
    ),
  ],
  args: {
    currentStep: 1,
    label: "创建进度",
    steps: ["基本信息", "账户", "商家", "功能", "确认", "邀请"],
  },
} satisfies Meta<typeof StepProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {
  name: "第 1 步",
};

export const MiddleStep: Story = {
  name: "第 3 步（前两步已完成）",
  args: { currentStep: 3 },
};

export const LastStep: Story = {
  name: "最后一步",
  args: { currentStep: 6 },
};
