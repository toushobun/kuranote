/** #1139 汇率换算说明，统计页、首页及账户汇总共用。 */
export const exchangeRateMessages = {
  convertedTotals: "含外币，按记录当天汇率换算",
  convertedAccountBalances: "含外币账户，按最新汇率换算",
  missingRecordRates: (count: number) => `有 ${count} 笔外币记录暂无汇率`,
  missingAccountRates: (count: number) => `有 ${count} 个外币账户暂无汇率`,
} as const;
