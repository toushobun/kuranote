import type { TransactionItemDbRow } from "internal/db-types";

// 与 monthly_record_amounts.test.sql 使用相同业务案例；business_net_amount 是关联视图的输出。
export const monthlyRecordAmountCases = [
  { name: "收支混合", expense: "5000", income: "2000", net: -3000 },
  { name: "旧手机抵价", expense: "8000", income: "4000", net: -4000 },
  {
    name: "关联退款",
    expense: "5000",
    income: "2000",
    expenseNet: "3000",
    incomeNet: "0",
    net: -3000,
    link: "refund",
  },
  {
    name: "关联报销",
    expense: "5000",
    income: "2000",
    expenseNet: "3000",
    incomeNet: "0",
    net: -3000,
    link: "reimbursement",
  },
  { name: "倒赚", expense: "2000", income: "5000", net: 3000 },
  {
    name: "超额退款",
    expense: "2000",
    income: "5000",
    expenseNet: "-3000",
    incomeNet: "0",
    net: 3000,
    link: "refund",
  },
  {
    name: "超额报销",
    expense: "2000",
    income: "5000",
    expenseNet: "-3000",
    incomeNet: "0",
    net: 3000,
    link: "reimbursement",
  },
  { name: "纯支出", expense: "5000", income: "0", net: -5000 },
  { name: "纯收入", expense: "0", income: "2000", net: 2000 },
  { name: "完全抵消", expense: "2000", income: "2000", net: 0 },
];

export const monthlyAmountCategories = [
  { id: "expense", name: "购物", parent_id: null, type: "expense" as const },
  { id: "income", name: "其他收入", parent_id: null, type: "income" as const },
];

export function createMonthlyAmountItems(
  testCase: (typeof monthlyRecordAmountCases)[number],
): TransactionItemDbRow[] {
  return [
    {
      amount: testCase.expense,
      business_net_amount: testCase.expenseNet ?? testCase.expense,
      category_id: "expense",
    },
    {
      amount: testCase.income,
      business_net_amount: testCase.incomeNet ?? testCase.income,
      category_id: "income",
    },
  ]
    .filter((item) => item.amount !== "0")
    .map((item, index) => ({
      ...item,
      id: `item-${index}`,
      account_id: null,
      transaction_record_id: "record",
      has_refund_link: testCase.link === "refund",
      has_reimbursement_link: testCase.link === "reimbursement",
    }));
}

export function expectedMonthlyAmountSummary(net: number) {
  return {
    balance: String(net),
    currency: "JPY",
    expense: String(Math.max(0, -net)),
    income: String(Math.max(0, net)),
  };
}
