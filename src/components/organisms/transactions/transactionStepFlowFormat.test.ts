import { describe, expect, it } from "vitest";
import {
  formatStepItemAmount,
  formatStepItemCategory,
  formatStepNetTotal,
} from "./transactionStepFlowFormat";

const lunch = {
  id: "lunch",
  name: "午餐",
  parentId: "food",
  parentName: "餐饮",
  type: "expense" as const,
};

describe("transactionStepFlowFormat", () => {
  it("品名按「大分类 · 小分类」显示，没有大分类或未选分类时回退", () => {
    expect(formatStepItemCategory(lunch)).toBe("餐饮 · 午餐");
    expect(
      formatStepItemCategory({ ...lunch, parentId: null, parentName: null }),
    ).toBe("午餐");
    expect(formatStepItemCategory()).toBe("未选择分类");
  });

  it("明细金额收入带加号，未填写时显示待输入", () => {
    expect(
      formatStepItemAmount({ amount: "498", category: lunch }, "JPY"),
    ).toBe("¥498");
    expect(
      formatStepItemAmount(
        { amount: "12.5", category: { ...lunch, type: "income" } },
        "CNY",
      ),
    ).toBe("+ ¥12.5");
    expect(formatStepItemAmount({ amount: " ", category: lunch }, "JPY")).toBe(
      "待输入",
    );
  });

  it("合计为支出减收入，收入较多时带加号", () => {
    expect(formatStepNetTotal(748, 0, "JPY")).toBe("¥748");
    expect(formatStepNetTotal(100, 300, "JPY")).toBe("+ ¥200");
  });
});
