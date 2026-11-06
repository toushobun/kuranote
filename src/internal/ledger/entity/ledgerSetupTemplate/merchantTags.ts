import type { LedgerSetupMerchantTagTemplate } from "./ledgerSetupTemplate";

export const ledgerSetupMerchantTags = [
  {
    key: "supermarket",
    name: "超市",
    icon: "🛒",
    sortOrder: 0,
    defaultSelected: true,
  },
  {
    key: "convenience_store",
    name: "便利店",
    icon: "🏪",
    sortOrder: 1,
    defaultSelected: true,
  },
  {
    key: "restaurant",
    name: "餐饮",
    icon: "🍽️",
    sortOrder: 2,
    defaultSelected: true,
  },
  {
    key: "shopping",
    name: "购物·订阅",
    icon: "🛍️",
    sortOrder: 3,
    defaultSelected: true,
  },
  {
    key: "transport",
    name: "交通",
    icon: "🚃",
    sortOrder: 4,
    defaultSelected: false,
  },
  {
    key: "living_expenses",
    name: "生活缴费",
    icon: "🧾",
    sortOrder: 5,
    defaultSelected: false,
  },
  {
    key: "public_service",
    name: "公共服务",
    icon: "🏛️",
    sortOrder: 6,
    defaultSelected: false,
  },
] as const satisfies readonly LedgerSetupMerchantTagTemplate[];
