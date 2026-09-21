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
      holderMissingCount: 0,
      processedCount: 80,
      rowResults: [],
      successCount: 80,
      totalCount: 80,
    },
    status: "completed",
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
            "一级分类「餐饮」没有填写二级分类；当前交易记录必须使用二级分类。",
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
        {
          content: "2026-09-17 全家便利店 600",
          reason:
            "账本内找不到显示名为「小明」的有效成员，已按无持有人继续导入该笔记录。",
          rowNumbers: [22],
          sheet: "incomeExpense",
          status: "holderMissing",
        },
      ],
      duplicateCount: 1,
      failureCount: 1,
      holderMissingCount: 1,
      processedCount: 80,
      rowResults: [],
      successCount: 78,
      totalCount: 80,
    },
    status: "completed",
  },
};
