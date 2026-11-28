import { makeBalanceAdjustmentTable } from "test/mocks/dataImport";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ExcelJS from "exceljs";
import { userEvent, within } from "storybook/test";

import type { DataImportBatchStateAction } from "types/dataImport";
import { DataImportTemplate } from "./DataImport";

const incomeExpenseHeader = [
  "账单关联",
  "日期",
  "记账人",
  "商家分类",
  "商家",
  "交易类型",
  "一级分类",
  "二级分类",
  "账户",
  "账户持有人",
  "账户币种",
  "账户类型",
  "金额",
  "备注",
];

function incomeExpenseRow(amount: string) {
  return [
    "",
    "2026-09-17 10:00:00",
    "",
    "",
    "便利店",
    "支出",
    "餐饮",
    "午餐",
    "现金",
    "",
    "JPY",
    "现金",
    amount,
    "",
  ];
}

// 「检查格式」在浏览器端真实解析文件，因此 Story 也现场生成真实的 xlsx。
async function buildXlsxFile(
  amounts: string[],
  includeBalanceAdjustment = false,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("收支");
  worksheet.addRow(incomeExpenseHeader);
  for (const amount of amounts) {
    worksheet.addRow(incomeExpenseRow(amount));
  }
  if (includeBalanceAdjustment) {
    const table = makeBalanceAdjustmentTable([
      { 金额: "1000" },
      { 金额: "-25" },
    ]);
    const sheet = workbook.addWorksheet(table.sourceName);
    sheet.addRow(table.headerRow);
    table.rows.forEach((row) => sheet.addRow(row.cells));
  }
  return new File([await workbook.xlsx.writeBuffer()], "demo.xlsx");
}

async function selectImportFile(canvasElement: HTMLElement, file: File) {
  const canvas = within(canvasElement);
  await userEvent.upload(canvas.getByLabelText("选择文件"), file);
}

const defaultBatchAction: DataImportBatchStateAction = async () => ({});

const meta = {
  title: "Templates/Settings/DataImportTemplate",
  component: DataImportTemplate,
  args: {
    executeBatchAction: defaultBatchAction,
    holderMembers: [],
  },
} satisfies Meta<typeof DataImportTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认（未选择文件）",
};

export const CheckPassed: Story = {
  name: "格式检查通过",
  play: async ({ canvasElement }) => {
    await selectImportFile(
      canvasElement,
      await buildXlsxFile(["1200", "35.5"]),
    );
  },
};

export const EmptyFile: Story = {
  name: "只有表头，无可导入记录",
  play: async ({ canvasElement }) => {
    await selectImportFile(canvasElement, await buildXlsxFile([]));
  },
};

export const CheckFailed: Story = {
  name: "格式检查未通过",
  play: async ({ canvasElement }) => {
    await selectImportFile(canvasElement, await buildXlsxFile(["abc"]));
  },
};

export const BalanceAdjustmentCheckPassed: Story = {
  name: "包含余额变更的格式检查通过态",
  play: async ({ canvasElement }) => {
    await selectImportFile(canvasElement, await buildXlsxFile(["1200"], true));
  },
};

export const Importing: Story = {
  name: "导入中",
  args: { executeBatchAction: () => new Promise(() => {}) },
  play: async ({ canvasElement }) => {
    await selectImportFile(canvasElement, await buildXlsxFile(["1200"]));
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "开始导入" }),
    );
  },
};

function completionStory(successCount: number, failureCount: number): Story {
  return {
    args: {
      executeBatchAction: async () => ({
        batch: {
          successCount,
          failureCount,
          createdPlaceholderCount: 0,
          holderMissingCount: 0,
          details: failureCount
            ? [
                {
                  sheet: "incomeExpense",
                  status: "failed",
                  rowNumbers: successCount ? [3] : [2, 3],
                  reason: "账户已归档，无法导入。",
                },
              ]
            : [],
        },
      }),
    },
    play: async ({ canvasElement }) => {
      await selectImportFile(
        canvasElement,
        await buildXlsxFile(["1200", "35.5"]),
      );
      const canvas = within(canvasElement);
      await userEvent.click(
        await canvas.findByRole("button", { name: "开始导入" }),
      );
    },
  };
}

export const Completed: Story = { ...completionStory(2, 0), name: "全部成功" };
export const Partial: Story = { ...completionStory(1, 1), name: "部分失败" };
export const AllFailed: Story = { ...completionStory(0, 2), name: "全部失败" };
