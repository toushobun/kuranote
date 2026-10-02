// 关联对象（账户、商家、成员、分类）缺失或已不可读取时显示的兜底名称。
// 「未知分类」「未知大分类」「未知小分类」分别用于不同场景，显示内容不同，不得合并。
// 数据库分组函数（load_transaction_group_summaries 系列，见 supabase/schema_snapshot/current_schema.sql）
// 中写死了同样的文字，修改这里的文字时需要同时新增 migration 更新这些函数。
export const transactionFallbackLabels = {
  account: "未知账户",
  category: "未知分类",
  member: "未知成员",
  merchant: "未知商家",
  parentCategory: "未知大分类",
  subcategory: "未知小分类",
} as const;
