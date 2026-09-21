// @vitest-environment node

import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";

import { maxImportFileSizeBytes } from "internal/dataImport/schema";
import { analyzeImportFile } from "internal/dataImport/util/analyzeImportFile";

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

describe("analyzeImportFile", () => {
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

    const { result, units } = await analyzeImportFile(
      new File([buffer], "income-expense.xlsx"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.incomeExpenseCount).toBe(1);
    }
    expect(units).toHaveLength(1);
    expect(units[0]).toMatchObject({
      group: { items: [expect.objectContaining({ merchantName: "便利店" })] },
      kind: "incomeExpense",
    });
  });

  it("收支与转账的执行单元按收支在前、转账在后展开", async () => {
    const buffer = await buildWorkbookBuffer([
      {
        name: "转账",
        rows: [
          [
            "交易类型",
            "日期",
            "记账人",
            "转出账户",
            "转出账户币种",
            "转出账户持有人",
            "转入账户",
            "转入账户币种",
            "转入账户持有人",
            "金额",
            "备注",
          ],
          [
            "转账",
            "2026-01-06 12:00:00",
            "",
            "现金",
            "CNY",
            "",
            "银行卡",
            "CNY",
            "",
            "100",
            "",
          ],
        ],
      },
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

    const { result, units } = await analyzeImportFile(
      new File([buffer], "both.xlsx"),
    );

    expect(result.ok).toBe(true);
    expect(units.map((unit) => unit.kind)).toEqual([
      "incomeExpense",
      "transfer",
    ]);
  });

  it("超过大小上限时不读取文件内容，直接返回结构性错误", async () => {
    const file = new File(["x"], "big.xlsx");
    Object.defineProperty(file, "size", { value: maxImportFileSizeBytes + 1 });
    const arrayBuffer = vi.spyOn(file, "arrayBuffer");

    const { result, units } = await analyzeImportFile(file);

    expect(result).toEqual({
      issues: [{ kind: "structural", message: "文件大小不能超过 50MB。" }],
      ok: false,
    });
    expect(units).toEqual([]);
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it("不支持的文件类型返回结构性错误", async () => {
    const { result, units } = await analyzeImportFile(
      new File(["whatever"], "notes.txt"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        expect.objectContaining({ kind: "structural" }),
      ]);
    }
    expect(units).toEqual([]);
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
    const { result, units } = await analyzeImportFile(
      new File([buffer], "unknown.xlsx"),
    );

    expect(result.ok).toBe(false);
    expect(units).toEqual([]);
  });
});
