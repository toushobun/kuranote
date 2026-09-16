import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { createDataImportValidationService } from "internal/dataImport/service/dataImportValidationService";

async function buildWorkbookBuffer(
  sheets: { name: string; rows: string[][] }[],
) {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    for (const row of sheet.rows) {
      worksheet.addRow(row);
    }
  }
  return (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}

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

describe("createDataImportValidationService", () => {
  it("解析并校验合法的 xlsx 收支文件", async () => {
    const buffer = await buildWorkbookBuffer([
      {
        name: "收支",
        rows: [
          incomeExpenseHeader,
          [
            "",
            "2026-01-05 12:00:00",
            "",
            "",
            "便利店",
            "支出",
            "餐饮",
            "午餐",
            "现金",
            "",
            "CNY",
            "35.5",
            "",
          ],
        ],
      },
    ]);

    const service = createDataImportValidationService();
    const result = await service.checkFile({
      fileBuffer: buffer,
      fileName: "income-expense.xlsx",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.incomeExpenseCount).toBe(1);
    }
  });

  it("不支持的文件类型返回结构性错误", async () => {
    const service = createDataImportValidationService();
    const result = await service.checkFile({
      fileBuffer: new TextEncoder().encode("whatever").buffer as ArrayBuffer,
      fileName: "notes.txt",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        expect.objectContaining({ kind: "structural" }),
      ]);
    }
  });

  it("sheet 名不匹配任何已知模板时返回结构性错误", async () => {
    const buffer = await buildWorkbookBuffer([
      {
        name: "未知表",
        rows: [
          ["姓名", "电话"],
          ["张三", "123"],
        ],
      },
    ]);
    const service = createDataImportValidationService();
    const result = await service.checkFile({
      fileBuffer: buffer,
      fileName: "unknown.xlsx",
    });

    expect(result.ok).toBe(false);
  });
});
