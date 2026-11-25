import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { dataImportExecutionErrorMessages } from "internal/dataImport";

import { DataImportExecutionStatus } from "./DataImportExecutionStatus";

const meta = {
  title: "Organisms/Settings/DataImportExecutionStatus",
  component: DataImportExecutionStatus,
} satisfies Meta<typeof DataImportExecutionStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSucceeded: Story = {
  name: "全部成功",
  args: {
    result: {
      details: [],
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      successCount: 80,
    },
  },
};

export const CreatedPlaceholders: Story = {
  name: "全部成功并新建了待邀请成员",
  args: {
    result: {
      details: [],
      failureCount: 0,
      createdPlaceholderCount: 2,
      holderMissingCount: 0,
      successCount: 80,
    },
  },
};

export const CreatedPlaceholdersMobile: Story = {
  ...CreatedPlaceholders,
  name: "全部成功并新建了待邀请成员（移动端）",
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};

export const MixedResult: Story = {
  name: "成功、失败与未匹配持有人混合",
  args: {
    result: {
      details: [
        {
          reason:
            dataImportExecutionErrorMessages.childCategoryRequired("餐饮"),
          rowNumbers: [12],
          sheet: "incomeExpense",
          status: "failed",
        },
        {
          reason: dataImportExecutionErrorMessages.holderMissingWarning("小明"),
          rowNumbers: [22],
          sheet: "incomeExpense",
          status: "holderMissing",
        },
      ],
      failureCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 1,
      successCount: 79,
    },
  },
};

export const BalanceAdjustmentResult: Story = {
  name: "余额变更成功与失败汇总",
  args: {
    result: {
      successCount: 2,
      failureCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      details: [
        {
          sheet: "balanceAdjustment",
          rowNumbers: [4],
          status: "failed",
          reason: "该账户已归档，无法导入余额变更。",
        },
      ],
    },
  },
};

export const AllFailed: Story = {
  name: "全部失败",
  args: {
    result: {
      successCount: 0,
      failureCount: 1,
      holderMissingCount: 0,
      createdPlaceholderCount: 0,
      details: [
        {
          sheet: "incomeExpense",
          rowNumbers: [2],
          status: "failed",
          reason: "账户已归档，无法导入。",
        },
      ],
    },
  },
};
