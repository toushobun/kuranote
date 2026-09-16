export const dataImportExportPageMessages = {
  title: "数据导入导出",
  backToSettings: "返回设置",
  subtitle: "迁移历史记账数据，或导出当前账本数据备份",
} as const;

export const dataImportExportEntryMessages = {
  import: {
    title: "数据导入",
    description: "从 xlsx 文件批量导入收支和转账记录",
  },
  export: {
    title: "数据导出",
    description: "将当前账本数据导出为文件，方便备份或迁移",
  },
} as const;

export const dataExportPlaceholderMessages = {
  title: "数据导出",
  comingSoonTitle: "数据导出功能即将上线",
  comingSoonDescription: "正在开发中，敬请期待。",
} as const;

export const dataTransferBackMessages = {
  backToEntry: "返回数据导入导出",
} as const;

export const dataImportPageMessages = {
  title: "数据导入",
  subtitle: "从 xlsx 文件批量导入收支和转账记录",
} as const;

export const dataImportFormatDescriptionMessages = {
  title: "文件格式要求",
  fileTypeHint:
    "支持 Excel（.xlsx）文件，大小不超过 10MB，工作表名需精确为「收支」「转账」「余额变更」。",
  holderColumnHint:
    "「账户持有人」列可以留空（0 个持有人），也可以填写一个持有人姓名（1 个持有人）；用分号「;」「；」填写多个持有人会被判定为格式错误。",
  recorderColumnHint:
    "「记账人」列不会被读取，导入的记账人统一为当前登录账号。",
  billRefHint:
    "「账单关联」列相同的多行中，除第一次出现的行外，日期、账户、账户持有人、账户币种、商家、商家分类、备注需填写「-」以继承首次出现那行的值（也可以原样复述该行内容）；「交易类型」不同则各自独立成交易。",
  balanceAdjustmentHint:
    "「余额变更」表本期暂不支持导入，识别到会在结果中提示并跳过，不影响其余表格。",
  incomeExpenseColumnsTitle: "「收支」表列名（*为必填）",
  transferColumnsTitle: "「转账」表列名（*为必填）",
} as const;

export const dataImportFileFieldMessages = {
  chooseFileButton: "选择文件",
  checkFormatButton: "检查格式",
  checking: "正在检查…",
  noFileSelected: "尚未选择文件",
} as const;

export const dataImportResultMessages = {
  balanceAdjustmentDetectedNotice:
    "另识别到「余额变更」表，本期暂不支持导入，已跳过。",
  failureTitle: "格式检查未通过",
  incomeExpenseCountLabel: (count: number) => `收支记录 ${count} 笔`,
  issueRowLabel: (rowNumber: number) => `第 ${rowNumber} 行`,
  successTitle: "格式检查通过",
  transferCountLabel: (count: number) => `转账记录 ${count} 笔`,
} as const;
