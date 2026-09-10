export const categoryPageMessages = {
  title: "分类管理",
  backToSettings: "返回设置",
  subtitle: (ledgerName: string) => `整理「${ledgerName}」的收支分类`,
} as const;

export const categorySuccessMessages = {
  create: "新增成功",
  update: "保存成功",
  archive: "归档成功",
} as const;

export const categoryArchiveMessages = {
  action: "归档该分类",
  title: "已归档分类",
  description: "归档的分类不会在记账选择中显示。",
} as const;

export const categorySearchMessages = {
  placeholder: "搜索分类名称",
  emptyTitle: "没有找到匹配的分类",
  emptyDescription: "试试其他分类名称，或清空搜索查看全部分类。",
} as const;
