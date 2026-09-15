export const dataImportExportPageMessages = {
  title: "数据导入导出",
  backToSettings: "返回设置",
  subtitle: "迁移历史记账数据，或导出当前账本数据备份",
} as const;

export const dataImportExportEntryMessages = {
  import: {
    title: "数据导入",
    description: "从 CSV / xlsx 文件批量导入收支和转账记录",
  },
  export: {
    title: "数据导出",
    description: "将当前账本数据导出为文件，方便备份或迁移",
  },
} as const;

export const dataTransferPlaceholderMessages = {
  import: {
    title: "数据导入",
    comingSoonTitle: "数据导入功能即将上线",
    comingSoonDescription: "正在开发中，敬请期待。",
  },
  export: {
    title: "数据导出",
    comingSoonTitle: "数据导出功能即将上线",
    comingSoonDescription: "正在开发中，敬请期待。",
  },
} as const;

export const dataTransferBackMessages = {
  backToEntry: "返回数据导入导出",
} as const;
