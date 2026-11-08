import { describe, expect, it } from "vitest";
import {
  formatStepItemAmount,
  formatStepItemCategory,
  formatStepNetTotal,
  summarizeStepReceiptTotals,
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

  it("换币种后小数位超出时显示真实金额，不按新币种四舍五入", () => {
    expect(
      formatStepItemAmount({ amount: "12.55", category: lunch }, "JPY"),
    ).toBe("¥12.55");
    expect(formatStepNetTotal(12.55, 0, "JPY")).toBe("¥12.55");
    expect(formatStepNetTotal(15.65, 3.1, "JPY")).toBe("¥12.55");
  });

  it("小票合计计入小数位超出的金额，跳过空金额并避免浮点误差", () => {
    const income = { ...lunch, type: "income" as const };
    expect(
      summarizeStepReceiptTotals([
        { amount: "12.55", category: lunch },
        { amount: "3.1", category: lunch },
        { amount: "", category: lunch },
        { amount: "0.2", category: income },
        { amount: "0.1", category: income },
      ]),
    ).toEqual({
      expenseTotal: 15.65,
      incomeTotal: 0.3,
      businessExpenseTotal: 15.65,
      businessIncomeTotal: 0.3,
      refundedTotal: 0,
      reimbursedTotal: 0,
      hasBusinessOffset: false,
    });
  });

  it("净额扣除被其他记录退款 / 报销核销的金额，并合计已退款与已报销", () => {
    expect(
      summarizeStepReceiptTotals([
        {
          amount: "10000",
          businessNetAmount: "5000",
          category: lunch,
          refundedAmount: "3000",
          reimbursementAmount: "2000",
        },
        {
          amount: "12.5",
          businessNetAmount: "12.5",
          category: lunch,
          refundedAmount: "0",
          reimbursementAmount: "0",
        },
      ]),
    ).toMatchObject({
      expenseTotal: 10012.5,
      businessExpenseTotal: 5012.5,
      refundedTotal: 3000,
      reimbursedTotal: 2000,
      hasBusinessOffset: true,
    });
  });

  it("核销超过原金额（结余）时业务金额为负，净额随之变为收入", () => {
    const totals = summarizeStepReceiptTotals([
      {
        amount: "1000",
        businessNetAmount: "-200",
        category: lunch,
        refundedAmount: "1200",
      },
    ]);
    expect(totals.businessExpenseTotal).toBe(-200);
    expect(
      formatStepNetTotal(
        totals.businessExpenseTotal,
        totals.businessIncomeTotal,
        "JPY",
      ),
    ).toBe("+ ¥200");
  });
});
