export const merchantPresetMessages = {
  chooserTitle: "新增商家",
  fromPreset: "从预设添加",
  presetDescription: "从常用商家中勾选，自动带上官网和别名",
  manual: "手动添加",
  manualDescription: "自己填写商家名称与信息",
  title: "从预设添加商家",
  description: (currency: string) => `已为你按 ${currency} 准备常用商家`,
  close: "关闭",
  cancel: "取消",
  selectAll: "全部选择",
  selectNone: "全不选",
  submit: (count: number) => `添加 ${count} 个商家`,
  submitting: "添加中…",
  success: (count: number) => `已添加 ${count} 个商家`,
  failureTitle: "添加失败",
  noTemplate: {
    title: "暂无该币种的预设商家",
    description: "可以先手动添加商家",
  },
  checklist: {
    added: "已添加",
    groupCheckboxLabel: (name: string) => `选择「${name}」的全部商家`,
    groupSelectedCount: (selected: number, total: number, added: number) =>
      `已选 ${selected} / ${total} 家${added > 0 ? ` · 已添加 ${added} 家` : ""}`,
    selectAll: "全选",
    selectNone: "全不选",
  },
};
