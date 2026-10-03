export const statisticsErrorCodes = {
  dashboardLoadFailed: "statistics_dashboard_load_failed",
  ledgerInvalid: "statistics_ledger_invalid",
  monthlyLoadFailed: "statistics_monthly_load_failed",
} as const;

export const statisticsErrorMessages = {
  ledgerLoadFailed: "账本信息加载失败，请稍后重试。",
  dashboardAccountsLoadFailed: "Dashboard 账户摘要加载失败，请稍后重试。",
  monthlyLoadFailed: "统计数据加载失败，请稍后重试。",
  relatedDataLoadFailed: "统计关联数据加载失败，请稍后重试。",
  categoriesLoadFailed: "统计分类数据加载失败，请稍后重试。",
  ledgerInvalid: "账本不存在、已归档或您无法访问。",
} as const;
