import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DataImportIssueList } from "./DataImportIssueList";

const meta = {
  title: "Organisms/Settings/DataImportIssueList",
  component: DataImportIssueList,
} satisfies Meta<typeof DataImportIssueList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grouped: Story = {
  name: "按工作表分组",
  args: {
    issues: [
      { reason: "缺少必填列。", rows: [] },
      {
        sheet: "incomeExpense",
        column: "金额",
        reason: "金额格式不正确。",
        rows: [2, 5, 8],
      },
      {
        sheet: "transfer",
        reason: "转出账户不能为空。",
        rows: [3],
      },
    ],
  },
};

export const Overflow: Story = {
  name: "超过二十组",
  args: {
    issues: Array.from({ length: 23 }, (_, index) => ({
      sheet: "incomeExpense" as const,
      reason: `账户 ${index + 1} 无法导入。`,
      rows: [index + 2],
    })),
  },
};
