/** 汇率缺失提示与账户余额换算说明。 */
export const exchangeRateMessages = {
  convertedAccountBalances: "含外币账户，按最新汇率换算",
  missingRecordRates: (count: number) => `有 ${count} 笔外币记录暂无汇率`,
  missingAccountRates: (count: number) => `有 ${count} 个外币账户暂无汇率`,
} as const;
