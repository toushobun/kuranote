import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import type { ImportExecutionRowResult } from "internal/dataImport";
import {
  buildDataImportResultFileName,
  buildDataImportResultWorkbook,
} from "utils/dataImportResultWorkbook";

async function createSourceWorkbook(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const incomeExpense = workbook.addWorksheet("收支");
  incomeExpense.addRow(["日期", "金额"]);
  incomeExpense.addRow(["2026-09-17 10:00:00", "1200"]);
  incomeExpense.addRow(["2026-09-17 11:00:00", "800"]);

  const transfer = workbook.addWorksheet("转账");
  transfer.addRow(["日期", "金额"]);
  transfer.addRow(["2026-09-17 12:00:00", "5000"]);

  const balanceAdjustment = workbook.addWorksheet("余额变更");
  balanceAdjustment.addRow(["日期", "金额"]);
  balanceAdjustment.addRow(["2026-09-17 13:00:00", "100"]);

  return (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}

describe("dataImportResultWorkbook", () => {
  it("保留原工作表并在收支、转账和余额变更右侧追加导入结果与原因", async () => {
    const source = await createSourceWorkbook();
    const rowResults: ImportExecutionRowResult[] = [
      {
        reason: null,
        rowNumber: 2,
        sheet: "incomeExpense",
        status: "success",
      },
      {
        reason: "疑似与现有记录重复，但已继续导入。",
        rowNumber: 3,
        sheet: "incomeExpense",
        status: "duplicate",
      },
      {
        reason:
          "账本内找不到显示名为「小明」的有效成员，已按无持有人继续导入该笔记录。",
        rowNumber: 2,
        sheet: "transfer",
        status: "holderMissing",
      },
      {
        reason: "该账户已归档，无法导入余额变更。",
        rowNumber: 2,
        sheet: "balanceAdjustment",
        status: "failed",
      },
    ];

    const output = await buildDataImportResultWorkbook(source, rowResults);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(output);

    const incomeExpense = workbook.getWorksheet("收支")!;
    expect(incomeExpense.getRow(1).getCell(3).value).toBe("导入结果");
    expect(incomeExpense.getRow(1).getCell(4).value).toBe("原因");
    expect(incomeExpense.getRow(2).getCell(3).value).toBe("成功");
    expect(incomeExpense.getRow(2).getCell(4).value).toBe("");
    expect(incomeExpense.getRow(3).getCell(3).value).toBe("成功（疑似重复）");
    expect(incomeExpense.getRow(3).getCell(4).value).toBe(
      "疑似与现有记录重复，但已继续导入。",
    );

    const transfer = workbook.getWorksheet("转账")!;
    expect(transfer.getRow(2).getCell(3).value).toBe("成功（未匹配持有人）");
    expect(transfer.getRow(2).getCell(4).value).toBe(
      "账本内找不到显示名为「小明」的有效成员，已按无持有人继续导入该笔记录。",
    );

    const balanceAdjustment = workbook.getWorksheet("余额变更")!;
    expect(balanceAdjustment.getRow(1).getCell(3).value).toBe("导入结果");
    expect(balanceAdjustment.getRow(2).getCell(3).value).toBe("失败");
    expect(balanceAdjustment.getRow(2).getCell(4).value).toBe(
      "该账户已归档，无法导入余额变更。",
    );
  });

  it("sheet 名带多余空格时仍能匹配并追加结果列", async () => {
    const workbook = new ExcelJS.Workbook();
    const incomeExpense = workbook.addWorksheet(" 收支 ");
    incomeExpense.addRow(["日期", "金额"]);
    incomeExpense.addRow(["2026-09-17 10:00:00", "1200"]);
    const source =
      (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer;

    const output = await buildDataImportResultWorkbook(source, [
      { reason: null, rowNumber: 2, sheet: "incomeExpense", status: "success" },
    ]);
    const result = new ExcelJS.Workbook();
    await result.xlsx.load(output);

    const sheet = result.getWorksheet(" 收支 ")!;
    expect(sheet.getRow(1).getCell(3).value).toBe("导入结果");
    expect(sheet.getRow(2).getCell(3).value).toBe("成功");
  });

  it("结果文件名在原文件名后追加导入结果后缀", () => {
    expect(buildDataImportResultFileName("history.xlsx")).toBe(
      "history_导入结果.xlsx",
    );
    expect(buildDataImportResultFileName("HISTORY.XLSX")).toBe(
      "HISTORY_导入结果.xlsx",
    );
  });
});
