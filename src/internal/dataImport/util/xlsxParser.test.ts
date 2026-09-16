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
