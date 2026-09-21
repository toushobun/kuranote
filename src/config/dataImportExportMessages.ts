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

export const dataExportPageMessages = {
  title: "数据导出",
  subtitle: "下载当前账本的全部交易记录",
  scopeTitle: "导出内容",
  scope: "包含全部收支、转账和余额变更记录，分别保存到三个工作表。",
  format:
    "文件格式为 Excel（.xlsx），列名与导入模板一致。日期使用当前设备时区。",
  empty: "没有交易记录时，仍会下载包含三个工作表表头的文件。",
  button: "导出 xlsx",
  exporting: "正在导出…",
  success: "导出文件已生成，已开始下载。",
  failureTitle: "导出失败",
  fileName: "KuraNote-账本交易.xlsx",
  loading: "导出页面加载中",
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
    "支持 Excel（.xlsx）文件，大小不超过 50MB，工作表名需精确为「收支」「转账」「余额变更」。",
  unknownColumnHint:
    "表头列名必须与下方列表完全一致（包括「转出/转入」等前缀），出现列表之外的列名会被判定为格式错误，不会被静默忽略。",
  holderColumnHint:
    "「账户持有人」列只能填写 0 个（留空）或 1 个持有人姓名，不支持填写多个持有人。",
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

export const dataImportExecutionMessages = {
  startButton: "开始导入",
  importingButton: "正在导入…",
  progressTitle: "正在导入",
  keepPageOpenHint: "导入需要一些时间，请保持页面打开，不要离开。",
  completedTitle: "导入完成",
  successCount: (count: number) => `成功导入 ${count} 条`,
  failureCount: (count: number) => `失败 ${count} 条`,
  duplicateCount: (count: number) => `疑似重复 ${count} 条`,
  holderMissingCount: (count: number) => `未匹配持有人 ${count} 条`,
  failedDetailTitle: "失败的记录",
  duplicateDetailTitle: "疑似重复的记录",
  holderMissingDetailTitle: "未匹配持有人的记录",
  detailRows: (rowNumbers: number[]) =>
    rowNumbers.length === 1
      ? `第 ${rowNumbers[0]} 行`
      : `第 ${rowNumbers.join("、")} 行`,
  downloadButton: "下载导入结果文件",
  downloadingButton: "正在生成结果文件…",
  downloadFailed: "结果文件生成失败，请稍后重试。",
  resultColumnTitle: "导入结果",
  reasonColumnTitle: "原因",
  resultSuccess: "成功",
  resultDuplicate: "成功（疑似重复）",
  resultHolderMissing: "成功（未匹配持有人）",
  resultFailed: "失败",
  resultFileSuffix: "_导入结果.xlsx",
} as const;
