// @vitest-environment node
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  analyzeImportFile,
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

  it.each(["123.45", "-67.89"])(
    "初始余额 %s 按普通余额变更导出并保留创建时间和固定备注",
    async (balanceDelta) => {
      const data = createDataExportFixture();
      const record = data.records[2];
      record.note = "初始余额";
      record.items[0].balanceDelta = balanceDelta;
      record.items[0].amount = String(Math.abs(Number(balanceDelta)));
      data.records = [record];
      const workbook = await loadWorkbook(data);
      const sheet = workbook.getWorksheet("余额变更")!;
      expect(sheet.rowCount).toBe(2);
      expect(cell(sheet, 2, "交易类型").value).toBe("余额变更");
      expect(cell(sheet, 2, "金额").value).toBe(balanceDelta);
      expect(cell(sheet, 2, "备注").value).toBe("初始余额");
      expect(cell(sheet, 2, "记账人").value).toBe(record.recorderName);
      expect(cell(sheet, 2, "日期").value).toBe(
        cell((await loadWorkbook()).getWorksheet("余额变更")!, 2, "日期").value,
      );
      expect(workbook.getWorksheet("收支")!.rowCount).toBe(1);
      expect(workbook.getWorksheet("转账")!.rowCount).toBe(1);
    },
  );

  it("只含余额变更（含非零初始余额）的导出文件可直接导入，差值总和与导出前账户余额一致", async () => {
    const data = createDataExportFixture();
    const [, , adjustment] = data.records;
    const adjustmentOf = (
      id: string,
      accountId: string,
      balanceDelta: string,
      note: string,
    ) => ({
      ...adjustment,
      id,
      note,
      items: [
        {
          ...adjustment.items[0],
          accountId,
          amount: balanceDelta.replace("-", ""),
          balanceDelta,
        },
      ],
    });
    data.records = [
      adjustmentOf("initial", "cash", "1000", "初始余额"),
      adjustmentOf("plus", "cash", "7.00", "盘点"),
      adjustmentOf("minus", "cash", "-20.5", ""),
      adjustmentOf("no-holder", "none", "-12.34", ""),
    ];
    const file = new File([await buildDataExportWorkbook(data)], "export.xlsx");

    const { result, units } = await analyzeImportFile(file);

    expect(result).toMatchObject({
      ok: true,
      summary: {
        balanceAdjustmentCount: 4,
        incomeExpenseCount: 0,
        transferCount: 0,
      },
    });
    const balances = new Map<string, number>();
    for (const unit of units) {
      if (unit.kind !== "balanceAdjustment") throw new Error("意外的单元");
      const key = `${unit.row.accountName}/${unit.row.accountHolder}`;
      balances.set(key, (balances.get(key) ?? 0) + unit.row.amount);
    }
    expect(
      [...balances.values()].map((v) => Math.round(v * 100) / 100),
    ).toEqual([986.5, -12.34]);
    expect(units[0]).toMatchObject({
      row: { amount: 1000, note: "初始余额" },
    });
  });

  it("引用缺失或转账方向无法判定时拒绝导出，而不是写出错误或空白数据", async () => {
    const broken = (
      mutate: (data: ReturnType<typeof createDataExportFixture>) => void,
    ) => {
      const data = createDataExportFixture();
      mutate(data);
      return buildDataExportWorkbook(data);
    };
    const error = { code: "data_export_incomplete" };
    await expect(
      broken((d) => {
        d.categories = [];
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        d.categories = d.categories.filter((c) => c.id !== "food");
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        d.accounts = d.accounts.filter((a) => a.id !== "cash");
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        d.records[1].items[0].balanceDelta = "0";
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        d.records[1].items = [];
      }),
    ).rejects.toMatchObject(error);
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
