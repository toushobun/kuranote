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
    amount,
    "",
  ];
}

// 「检查格式」在浏览器端真实解析文件，因此 Story 也现场生成真实的 xlsx。
async function buildXlsxFile(amounts: string[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("收支");
  worksheet.addRow(incomeExpenseHeader);
  for (const amount of amounts) {
    worksheet.addRow(incomeExpenseRow(amount));
  }
  return new File([await workbook.xlsx.writeBuffer()], "demo.xlsx");
}

async function selectFileAndSubmit(canvasElement: HTMLElement, file: File) {
  const canvas = within(canvasElement);
  await userEvent.upload(canvas.getByLabelText("选择文件"), file);
  await userEvent.click(
    await canvas.findByRole("button", { name: "检查格式" }),
  );
}

const defaultBatchAction: DataImportBatchStateAction = async () => ({});

const meta = {
  title: "Templates/Settings/DataImportTemplate",
  component: DataImportTemplate,
  args: {
    executeBatchAction: defaultBatchAction,
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
    await selectFileAndSubmit(
      canvasElement,
      await buildXlsxFile(["1200", "35.5"]),
    );
  },
};

export const CheckFailed: Story = {
  name: "格式检查未通过",
  play: async ({ canvasElement }) => {
    await selectFileAndSubmit(canvasElement, await buildXlsxFile(["abc"]));
  },
};
