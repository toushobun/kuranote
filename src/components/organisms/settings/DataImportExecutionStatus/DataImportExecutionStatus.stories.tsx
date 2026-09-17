import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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
      processedCount: 80,
      rowResults: [],
      successCount: 80,
      totalCount: 80,
    },
    status: "completed",
  },
};

export const MixedResult: Story = {
  name: "成功、失败与疑似重复混合",
  args: {
    result: {
      details: [
        {
          content: "2026-09-17 业务超市 1200",
          reason: "账户持有人无法匹配。",
          rowNumbers: [12],
          sheet: "incomeExpense",
          status: "failed",
        },
        {
          content: "2026-09-17 钱包 → 银行卡 5000",
          reason: "疑似与现有记录重复，但已继续导入。",
          rowNumbers: [18],
          sheet: "transfer",
          status: "duplicate",
        },
      ],
      duplicateCount: 1,
      failureCount: 1,
      processedCount: 80,
      rowResults: [],
      successCount: 79,
      totalCount: 80,
    },
    status: "completed",
  },
};
