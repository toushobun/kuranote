import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { dataImportExecutionErrorMessages } from "internal/dataImport";

import { DataImportExecutionStatus } from "./DataImportExecutionStatus";

const meta = {
  title: "Organisms/Settings/DataImportExecutionStatus",
  component: DataImportExecutionStatus,
  args: {
    onDownload: () => undefined,
  },
} satisfies Meta<typeof DataImportExecutionStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Importing: Story = {
  name: "导入中",
  args: {
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      processedCount: 36,
      rowResults: [],
      successCount: 36,
      totalCount: 80,
    },
    status: "importing",
  },
};

export const ImportingWithSimulatedProgress: Story = {
  name: "导入中（虚拟进度条）",
  args: {
    displayProgress: 68,
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      processedCount: 36,
      rowResults: [],
      successCount: 36,
      totalCount: 80,
    },
    status: "importing",
  },
};

export const AllSucceeded: Story = {
  name: "全部成功",
  args: {
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      processedCount: 80,
      rowResults: [],
      successCount: 80,
      totalCount: 80,
    },
    status: "completed",
  },
};

export const CreatedPlaceholders: Story = {
  name: "全部成功并新建了待邀请成员",
  args: {
    result: {
      details: [],
      duplicateCount: 0,
      failureCount: 0,
      createdPlaceholderCount: 2,
      holderMissingCount: 0,
      processedCount: 80,
      rowResults: [],
      successCount: 80,
      totalCount: 80,
    },
    status: "completed",
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
  name: "成功、失败、疑似重复与未匹配持有人混合",
  args: {
    result: {
      details: [
        {
          content: "2026-09-17 业务超市 1200",
          reason:
            dataImportExecutionErrorMessages.childCategoryRequired("餐饮"),
          rowNumbers: [12],
          sheet: "incomeExpense",
          status: "failed",
        },
        {
          content: "2026-09-17 钱包 → 银行卡 5000",
          reason: dataImportExecutionErrorMessages.duplicateWarning,
          rowNumbers: [18],
          sheet: "transfer",
          status: "duplicate",
        },
        {
          content: "2026-09-17 全家便利店 600",
          reason: dataImportExecutionErrorMessages.holderMissingWarning("小明"),
          rowNumbers: [22],
          sheet: "incomeExpense",
          status: "holderMissing",
        },
      ],
      duplicateCount: 1,
      failureCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 1,
      processedCount: 80,
      rowResults: [],
      successCount: 78,
      totalCount: 80,
    },
    status: "completed",
  },
};

export const BalanceAdjustmentResult: Story = {
  name: "余额变更成功、失败与疑似重复汇总",
  args: {
    status: "completed",
    result: {
      successCount: 2,
      failureCount: 1,
      duplicateCount: 1,
      createdPlaceholderCount: 0,
      holderMissingCount: 0,
      processedCount: 3,
      totalCount: 3,
      details: [
        {
          sheet: "balanceAdjustment",
          rowNumbers: [3],
          content: "2026-01-05 现金 -20",
          status: "duplicate",
          reason: dataImportExecutionErrorMessages.duplicateWarning,
        },
        {
          sheet: "balanceAdjustment",
          rowNumbers: [4],
          content: "2026-01-05 已归档账户 +50",
          status: "failed",
          reason: "该账户已归档，无法导入余额变更。",
        },
      ],
      rowResults: [
        {
          sheet: "balanceAdjustment",
          rowNumber: 2,
          status: "success",
          reason: null,
        },
        {
          sheet: "balanceAdjustment",
          rowNumber: 3,
          status: "duplicate",
          reason: "疑似重复",
        },
        {
          sheet: "balanceAdjustment",
          rowNumber: 4,
          status: "failed",
          reason: "账户已归档",
        },
      ],
    },
  },
};
