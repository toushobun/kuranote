import type { TransactionStepFlowProps } from "organisms/transactions/TransactionStepFlow/TransactionStepFlow.types";
const tags = [
  { id: "food", name: "餐饮", icon: "🍴", merchant_count: 1, sort_order: 0 },
  { id: "shop", name: "超市", icon: "🛒", merchant_count: 2, sort_order: 1 },
];
export const flowFixture: TransactionStepFlowProps = {
  open: true,
  action: async () => ({}),
  merchants: [
    { id: "life", name: "LIFE超市", icon_url: null, tags: [tags[1]] },
    { id: "seven", name: "7-Eleven", icon_url: null, tags: [tags[1]] },
    { id: "coffee", name: "星巴克", icon_url: null, tags: [tags[0]] },
  ],
  merchantTags: tags,
  frequentMerchants: [
    { merchantId: "seven", recordCount: 20 },
    { merchantId: "life", recordCount: 10 },
    { merchantId: "coffee", recordCount: 5 },
  ],
  accounts: [
    {
      id: "cash",
      name: "现金",
      currency: "JPY",
      holders: [{ display_name: "我" }],
    },
    {
      id: "paypay",
      name: "PayPay",
      currency: "JPY",
      holders: [{ display_name: "我" }],
    },
    {
      id: "cny",
      name: "招商银行卡",
      currency: "CNY",
      holders: [{ display_name: "妻子" }],
    },
    {
      id: "bank",
      name: "乐天银行",
      currency: "JPY",
      holders: [{ display_name: "我" }],
    },
  ],
  suggestions: {
    recommendedAccountIds: ["paypay", "cash", "cny"],
    automaticCategoryIds: [],
    quickAmounts: [],
  },
  onClose: () => {},
  onMethodChange: () => {},
  onMerchantSelect: () => {},
  onAccountSelect: () => {},
  onAddMerchant: () => {},
  onAddPresets: () => {},
  onAddAccount: () => {},
};

export const merchantStepFixture = {
  merchants: flowFixture.merchants,
  merchantTags: flowFixture.merchantTags,
  frequentMerchants: flowFixture.frequentMerchants,
  onSelect: flowFixture.onMerchantSelect,
  onAddMerchant: flowFixture.onAddMerchant,
  onAddPresets: flowFixture.onAddPresets,
};
export const accountStepFixture = {
  accounts: flowFixture.accounts,
  recommendedAccountIds: flowFixture.suggestions?.recommendedAccountIds,
  onSelect: flowFixture.onAccountSelect,
  onAddAccount: flowFixture.onAddAccount,
};
