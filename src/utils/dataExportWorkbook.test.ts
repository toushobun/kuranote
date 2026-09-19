// @vitest-environment node
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  importColumnsBySheetKind,
  importSheetKindLabels,
} from "internal/dataImport";
import {
  createDataExportFixture,
  createEmptyDataExport,
} from "test/mocks/dataExport";
import { buildDataExportWorkbook } from "./dataExportWorkbook";

async function loadWorkbook(data = createDataExportFixture()) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await buildDataExportWorkbook(data));
  return workbook;
}
function cell(sheet: ExcelJS.Worksheet, row: number, name: string) {
  const headers = sheet.getRow(1).values as string[];
  return sheet.getRow(row).getCell(headers.indexOf(name));
}

describe("dataExportWorkbook", () => {
  it("按原始明细导出多分类收支、真实记账人、分类层级和商家展示名", async () => {
    const sheet = (await loadWorkbook()).getWorksheet("收支")!;
    expect(sheet.rowCount).toBe(4);
    expect(cell(sheet, 2, "账单关联").value).toBe("normal");
    expect(cell(sheet, 3, "账单关联").value).toBe("normal");
    expect(cell(sheet, 2, "记账人").value).toBe("历史记账人");
    expect(cell(sheet, 2, "一级分类").value).toBe("饮食");
    expect(cell(sheet, 2, "二级分类").value).toBe("午餐");
    expect(cell(sheet, 3, "二级分类").value).toBe("");
    expect(cell(sheet, 2, "金额").value).toBe("123.45");
    expect(cell(sheet, 2, "交易类型").value).toBe("支出");
    expect(cell(sheet, 4, "交易类型").value).toBe("收入");
    expect(cell(sheet, 2, "商家").value).toBe("商家展示名");
    expect(cell(sheet, 2, "商家分类").value).toBe("餐饮、附近");
    expect(cell(sheet, 2, "备注").value).toBe("=原样备注");
    expect(cell(sheet, 2, "备注").type).toBe(ExcelJS.ValueType.String);
    const date = new Date("2026-09-19T01:02:03.000Z");
    const pad = (value: number) => String(value).padStart(2, "0");
    expect(cell(sheet, 2, "日期").value).toBe(
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    );
  });

  it("转账按余额方向选择两端账户并分别应用持有人颜色", async () => {
    const workbook = await loadWorkbook();
    const transfer = workbook.getWorksheet("转账")!;
    expect(transfer.rowCount).toBe(2);
    expect(cell(transfer, 2, "转出账户").value).toBe("现金");
    expect(cell(transfer, 2, "转入账户").value).toBe("存款");
    expect(cell(transfer, 2, "金额").value).toBe("300");
    for (const name of ["转出账户", "转出账户持有人"])
      expect(cell(transfer, 2, name).font.color).toEqual({ argb: "FF3F9FF4" });
    for (const name of ["转入账户", "转入账户持有人"])
      expect(cell(transfer, 2, name).font.color).toEqual({ argb: "FFE5576C" });
    const normal = workbook.getWorksheet("收支")!;
    for (const name of ["账户", "账户持有人"])
      expect(cell(normal, 2, name).font.color).toEqual({ argb: "FF3F9FF4" });
  });

  it("余额变更保留正负金额，无持有人不设置字体颜色", async () => {
    const data = createDataExportFixture();
    data.records.push({
      ...data.records[2],
      id: "positive",
      items: [
        {
          ...data.records[2].items[0],
          accountId: "cash",
          balanceDelta: "7.00",
        },
      ],
    });
    const sheet = (await loadWorkbook(data)).getWorksheet("余额变更")!;
    expect(sheet.rowCount).toBe(3);
    expect(cell(sheet, 2, "金额").value).toBe("-12.34");
    expect(cell(sheet, 3, "金额").value).toBe("7.00");
    expect(cell(sheet, 2, "账户持有人").value).toBe("");
    expect(cell(sheet, 2, "账户").font?.color).toBeUndefined();
    expect(cell(sheet, 3, "账户").font.color).toEqual({ argb: "FF3F9FF4" });
  });

  it("空账本也生成三个工作表，列名顺序复用导入定义且表头加粗填绿", async () => {
    const workbook = await loadWorkbook(createEmptyDataExport());
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "收支",
      "转账",
      "余额变更",
    ]);
    for (const kind of [
      "incomeExpense",
      "transfer",
      "balanceAdjustment",
    ] as const) {
      const sheet = workbook.getWorksheet(importSheetKindLabels[kind])!;
      expect(sheet.rowCount).toBe(1);
      expect((sheet.getRow(1).values as string[]).slice(1)).toEqual(
        importColumnsBySheetKind[kind].map((column) => column.name),
      );
      sheet.getRow(1).eachCell((header) => {
        expect(header.font.bold).toBe(true);
        expect(header.fill).toMatchObject({
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF92D050" },
        });
      });
    }
  });
});
