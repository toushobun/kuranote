import type { DataExport } from "internal/dataExport";

export function createDataExportFixture(): DataExport {
  const common = {
    transactionAt: "2026-09-19T01:02:03.000Z",
    recorderName: "历史记账人",
    note: "=原样备注",
    merchantId: "shop",
  };
  return {
    accounts: [
      {
        id: "cash",
        name: "现金",
        currency: "JPY",
        type: "cash",
        holder: { name: "小明", displayColor: "sky" },
      },
      {
        id: "bank",
        name: "存款",
        currency: "JPY",
        type: "bank",
        holder: { name: "小红", displayColor: "rose" },
      },
      {
        id: "none",
        name: "公共账户",
        currency: "CNY",
        type: "other",
        holder: null,
      },
    ],
    categories: [
      { id: "food", name: "🍚 饮食", parent_id: null, type: "expense" },
      { id: "lunch", name: "午餐", parent_id: "food", type: "expense" },
      { id: "salary", name: "工资", parent_id: null, type: "income" },
    ],
    merchants: [{ id: "shop", name: "商家展示名", tagNames: ["餐饮", "附近"] }],
    records: [
      {
        ...common,
        id: "normal",
        type: "normal",
        items: [
          {
            accountId: "cash",
            categoryId: "lunch",
            amount: "123.45",
            balanceDelta: "-123.45",
          },
          {
            accountId: "cash",
            categoryId: "food",
            amount: "50",
            balanceDelta: "-50",
          },
          {
            accountId: "cash",
            categoryId: "salary",
            amount: "10",
            balanceDelta: "10",
          },
        ],
      },
      {
        ...common,
        id: "transfer",
        type: "transfer",
        merchantId: null,
        items: [
          {
            accountId: "bank",
            categoryId: null,
            amount: "300",
            balanceDelta: "300",
          },
          {
            accountId: "cash",
            categoryId: null,
            amount: "300",
            balanceDelta: "-300",
          },
        ],
      },
      {
        ...common,
        id: "adjustment",
        type: "balance_adjustment",
        merchantId: null,
        items: [
          {
            accountId: "none",
            categoryId: null,
            amount: "12.34",
            balanceDelta: "-12.34",
          },
        ],
      },
    ],
  };
}

export function createEmptyDataExport(): DataExport {
  return { accounts: [], categories: [], merchants: [], records: [] };
}
