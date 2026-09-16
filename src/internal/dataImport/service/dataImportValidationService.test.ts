import { describe, expect, it } from "vitest";

import { createDataImportValidationService } from "internal/dataImport/service/dataImportValidationService";

function toBuffer(text: string) {
  return new TextEncoder().encode(text).buffer as ArrayBuffer;
}

describe("createDataImportValidationService", () => {
  it("解析并校验合法的 CSV 收支文件", async () => {
    const csv = [
      "账单关联,日期,记账人,商家分类,商家,交易类型,一级分类,二级分类,账户,账户持有人,账户币种,金额,备注",
      ",2026-01-05,,,便利店,支出,餐饮,午餐,现金,,CNY,35.5,",
    ].join("\n");

    const service = createDataImportValidationService();
    const result = await service.checkFile({
      fileBuffer: toBuffer(csv),
      fileName: "income-expense.csv",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.incomeExpenseCount).toBe(1);
    }
  });

  it("不支持的文件类型返回结构性错误", async () => {
    const service = createDataImportValidationService();
    const result = await service.checkFile({
      fileBuffer: toBuffer("whatever"),
      fileName: "notes.txt",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        expect.objectContaining({ kind: "structural" }),
      ]);
    }
  });

  it("表头不匹配任何已知模板时返回结构性错误", async () => {
    const csv = ["姓名,电话", "张三,123"].join("\n");
    const service = createDataImportValidationService();
    const result = await service.checkFile({
      fileBuffer: toBuffer(csv),
      fileName: "unknown.csv",
    });

    expect(result.ok).toBe(false);
  });
});
