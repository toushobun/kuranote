import { regionPresetMessages } from "./regionPresetMessages";

export const merchantPresetMessages = {
  chooserTitle: "新增商家",
  fromPreset: "从预设添加",
  presetDescription: "从常用商家中勾选，自动带上官网和别名",
  manual: "手动添加",
  manualDescription: "自己填写商家名称与信息",
  title: "从预设添加商家",
  description: "勾选要添加的商家，已添加的商家会标记在列表中。",
  noTemplate: "暂无可用的商家预设",
  close: "关闭",
  cancel: "取消",
  submit: (count: number) => `添加 ${count} 个商家`,
  submitting: "添加中…",
  success: (count: number) => `已添加 ${count} 个商家`,
  failureTitle: "添加失败",
  loading: "正在读取预设商家…",
  loadFailureTitle: "读取失败",
  checklist: {
    alsoIn: regionPresetMessages.alsoIn,
    added: "已添加",
    groupCheckboxLabel: (name: string) => `选择「${name}」的全部商家`,
    groupSelectedCount: (selected: number, total: number, added: number) =>
      `${selected} / ${total}${added > 0 ? ` · 已添加 ${added}` : ""}`,
  },
};
