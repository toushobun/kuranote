// 首页最近使用账户查询的历史记录窗口，最多读取 100 笔交易及账户变动。
export const dashboardRecentAccountHistoryLimit = 100;

// 现有常用分类查询至少累计 20 条历史明细，不足时向更早月份扩展。
export const minimumHistoryItemCount = 20;

// 现有明细选择抽屉的常用快捷分类最多返回 5 个，含手动顺序回退。
export const frequentCategoryLimit = 5;

// 从商家记账的收支账户步骤最多推荐 3 个账户（预定义）。
export const recommendedAccountLimit = 3;

// 从商家记账的商家选择步骤按全期间交易次数展示最多 8 个常用商家（预定义）。
export const frequentMerchantLimit = 8;

// 从商家记账时，小分类出现的记录数达到样本数（该商家最近的记录数，最多 20 笔）的一半（向上取整）
// 才自动添加明细，每笔记录只计一次（预定义）。
export const automaticCategoryRecordRatio = 1 / 2;

// 自动添加明细的记录数下限：样本不足时也至少 2 笔；只有 1 笔记录时下限取样本数，该记录的小分类全部加入（预定义）。
export const automaticCategoryMinimumRecordCount = 2;

// 从商家记账的金额键盘最多提供 4 个常用金额（预定义）。
export const frequentAmountLimit = 4;

// 从商家记账的常用金额至少出现 2 次，排除只出现一次的金额（预定义）。
export const frequentAmountMinimumOccurrenceCount = 2;
