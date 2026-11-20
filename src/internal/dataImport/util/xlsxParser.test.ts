import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { parseXlsxWorkbook } from "internal/dataImport/util/xlsxParser";

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
  return workbook.xlsx.writeBuffer();
}

describe("parseXlsxWorkbook", () => {
  it("将每个非空工作表解析为一个 ParsedTable", async () => {
    const buffer = await buildWorkbookBuffer([
      {
        name: "收支",
        rows: [
          ["日期", "金额"],
          ["2026-01-01", "100"],
          ["2026-01-02", "200"],
        ],
      },
    ]);

    const tables = await parseXlsxWorkbook(buffer as unknown as ArrayBuffer);

    expect(tables).toHaveLength(1);
    expect(tables[0].sourceName).toBe("收支");
    expect(tables[0].headerRow).toEqual(["日期", "金额"]);
    expect(tables[0].rows).toEqual([
      { cells: ["2026-01-01", "100"], rowNumber: 2 },
      { cells: ["2026-01-02", "200"], rowNumber: 3 },
    ]);
  });

  it.each([
    ["转账", "transfer"],
    ["余额变更", "balanceAdjustment"],
  ] as const)("不静默忽略「%s」表的内嵌照片", async (name, kind) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(["日期", "金额"]);
    sheet.addRow(["2026-01-01", "100"]);
    const image = workbook.addImage({
      base64: "/9j/2Q==",
      extension: "jpeg",
    });
    sheet.addImage(image, {
      tl: { col: 1, row: 1 },
      br: { col: 2, row: 2 },
      editAs: "twoCell",
    } as unknown as Parameters<typeof sheet.addImage>[1]);
    const tables = await parseXlsxWorkbook(
      (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer,
    );
    expect(tables[0].photoIssues).toMatchObject([
      { kind: "row", rowNumber: 2, sheet: kind },
    ]);
  });

  it("只有图片而没有单元格的收支工作表不能被当成空表跳过", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("收支");
    const image = workbook.addImage({
      base64: "/9j/2Q==",
      extension: "jpeg",
    });
    sheet.addImage(image, {
      tl: { col: 0, row: 0 },
      br: { col: 1, row: 1 },
      editAs: "twoCell",
    } as unknown as Parameters<typeof sheet.addImage>[1]);
    const tables = await parseXlsxWorkbook(
      (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer,
    );
    expect(tables).toHaveLength(1);
    expect(tables[0].photoIssues).toMatchObject([
      { kind: "row", sheet: "incomeExpense" },
    ]);
  });

  it("跳过完全空白的工作表", async () => {
    const buffer = await buildWorkbookBuffer([
      { name: "空表", rows: [] },
      { name: "收支", rows: [["日期"], ["2026-01-01"]] },
    ]);

    const tables = await parseXlsxWorkbook(buffer as unknown as ArrayBuffer);

    expect(tables).toHaveLength(1);
    expect(tables[0].sourceName).toBe("收支");
  });

  it("跳过表头下方完全空白的行，但保留行号", async () => {
    const worksheet = new ExcelJS.Workbook().addWorksheet("收支");
    worksheet.addRow(["日期", "金额"]);
    worksheet.addRow([]);
    worksheet.addRow(["2026-01-01", "100"]);
    const buffer = await worksheet.workbook.xlsx.writeBuffer();

    const tables = await parseXlsxWorkbook(buffer as unknown as ArrayBuffer);

    expect(tables[0].rows).toEqual([
      { cells: ["2026-01-01", "100"], rowNumber: 3 },
    ]);
  });
});
