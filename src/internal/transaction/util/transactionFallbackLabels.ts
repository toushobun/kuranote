// 关联对象（账户、商家、成员、分类）缺失或已不可读取时显示的兜底名称。
// 「未知分类」「未知大分类」「未知小分类」分别用于不同场景，显示内容不同，不得合并。
export const transactionFallbackLabels = {
  account: "未知账户",
  category: "未知分类",
  member: "未知成员",
  merchant: "未知商家",
  parentCategory: "未知大分类",
  subcategory: "未知小分类",
} as const;
