export const accountTypes = [
  "cash",
  "bank",
  "credit_card",
  "e_money",
  "other",
] as const;

export type AccountType = (typeof accountTypes)[number];

/** 账户类型的中文标签：账户页面与数据导入导出共用这一份。 */
export const accountTypeOptions = [
  { label: "现金", value: "cash" },
  { label: "银行卡", value: "bank" },
  { label: "信用卡", value: "credit_card" },
  { label: "电子钱包", value: "e_money" },
  { label: "其他", value: "other" },
] as const satisfies readonly { label: string; value: AccountType }[];
