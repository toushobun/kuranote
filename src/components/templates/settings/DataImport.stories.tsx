import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import type { DataImportStateAction } from "types/dataImport";
import { DataImportTemplate } from "./DataImport";

async function selectFileAndSubmit(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const file = new File(["binary"], "demo.xlsx");
  await userEvent.upload(canvas.getByLabelText("选择文件"), file);
  await userEvent.click(
    await canvas.findByRole("button", { name: "检查格式" }),
  );
}

const defaultAction: DataImportStateAction = async () => ({});

const successAction: DataImportStateAction = async () => ({
  result: {
    ok: true,
    summary: {
      balanceAdjustmentDetected: true,
      incomeExpenseCount: 12,
      transferCount: 3,
    },
  },
});

const failureAction: DataImportStateAction = async () => ({
  result: {
    issues: [
      { kind: "structural", message: "「收支」表缺少必填列：账户币种。" },
      {
        column: "金额",
        kind: "row",
        message: "金额必须是不超过两位小数的非负数字。",
        rowNumber: 3,
        sheet: "incomeExpense",
      },
      {
        column: "转入账户",
        kind: "row",
        message: "转出账户与转入账户不能是同一个账户。",
        rowNumber: 5,
        sheet: "transfer",
      },
    ],
    ok: false,
  },
});

const meta = {
  title: "Templates/Settings/DataImportTemplate",
  component: DataImportTemplate,
  args: { checkFormatAction: defaultAction },
} satisfies Meta<typeof DataImportTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "默认（未选择文件）",
};

export const CheckPassed: Story = {
  name: "格式检查通过",
  args: { checkFormatAction: successAction },
  play: async ({ canvasElement }) => {
    await selectFileAndSubmit(canvasElement);
  },
};

export const CheckFailed: Story = {
  name: "格式检查未通过",
  args: { checkFormatAction: failureAction },
  play: async ({ canvasElement }) => {
    await selectFileAndSubmit(canvasElement);
  },
};
