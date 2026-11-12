export const categoryPageMessages = {
  title: "分类管理",
  backToSettings: "返回设置",
  subtitle: (ledgerName: string) => `整理「${ledgerName}」的收支分类`,
  loading: "分类数据加载中",
} as const;

export const categorySuccessMessages = {
  create: "新增成功",
  update: "保存成功",
  archive: "归档成功",
} as const;

export const categoryArchiveMessages = {
  action: "归档该分类",
} as const;

export const categoryArchiveConfirmMessages = {
  title: "归档该分类？",
  description: "归档后该分类不会在记账选择中显示，确定要归档吗？",
  confirm: "归档",
} as const;

export const categorySystemMessages = {
  badge: "系统",
  locked: "系统分类不可修改、删除或归档。",
  invalid: "系统分类的类型或归属不正确。",
  parentLocked: "系统大分类下不能新增其他小分类。",
  nameReserved: "「特殊收入」「退款」「报销」是系统保留名称，请使用其他名称。",
} as const;

export const categorySearchMessages = {
  placeholder: "搜索分类名称",
  emptyTitle: "没有找到匹配的分类",
  emptyDescription: "试试其他分类名称，或清空搜索查看全部分类。",
} as const;
