import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StepProgress } from "./StepProgress";

const meta = {
  title: "Molecules/UI/StepProgress",
  component: StepProgress,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
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

export const EditableCompletedSteps: Story = {
  name: "返回修改时保留其他完成状态",
  args: {
    steps: ["商家", "账户", "明细", "确认"],
    currentStep: 2,
    completedSteps: [1, 2, 3],
    clickableSteps: [1, 2, 3, 4],
    onStepClick: () => {},
  },
};

export const WithStepDetails: Story = {
  name: "步骤名下方显示选择内容",
  args: {
    steps: ["商家", "账户", "明细", "确认"],
    stepDetails: ["7-Eleven", "三井住友卡 等 2 个账户"],
    currentStep: 3,
    completedSteps: [1, 2],
    clickableSteps: [1, 2, 3, 4],
    onStepClick: () => {},
  },
};

export const LongStepDetails: Story = {
  name: "选择内容过长时省略",
  args: {
    ...WithStepDetails.args,
    stepDetails: ["Amazon マーケットプレイス 日本", "三井住友カード ゴールド"],
  },
};
