import { accountTypeOptions } from "internal/account";

const accountTypeLabelsText = accountTypeOptions
  .map((option) => option.label)
  .join("、");

export const dataImportExportPageMessages = {
  title: "数据导入导出",
  backToSettings: "返回设置",
  subtitle: "导入历史记录，或导出备份",
} as const;

export const dataImportExportEntryMessages = {
  import: {
    title: "数据导入",
    description: "从 Excel 文件导入记录和小票照片",
  },
  export: {
    title: "数据导出",
    description: "把当前账本导出为 Excel 文件备份",
  },
} as const;

export const dataExportPageMessages = {
  title: "数据导出",
  subtitle: "把记录下载为 Excel 文件",
  scopeTitle: "导出范围",
  dateRange: "日期区间",
  dateSummary: (start: string, end: string) =>
    start || end ? `${start || "不限"} – ${end || "不限"}` : "全部日期",
  startDate: "开始日期",
  endDate: "结束日期",
  invalidDateRange: "结束日期不能早于开始日期",
  fallbackLedgerName: "账本",
  recordTypesTitle: "记录类型",
  recordTypes: {
    normal: "收支",
    transfer: "转账",
    balance_adjustment: "余额变更",
  },
  scope: "导出的文件可以直接用来导入。",
  button: "导出 Excel",
  includePhotos: "导出照片",
  photoSizeHint: "包含照片的文件较大，导出需要更久。",
  photoProgress: (done: number, total: number) =>
    `正在准备照片 ${done}/${total}`,
  success: (fileName: string) => `已开始下载 ${fileName}`,
  failureTitle: "导出失败",
  loading: "导出页面加载中",
} as const;

export const dataTransferBackMessages = {
  backToEntry: "返回数据导入导出",
} as const;

export const dataImportPageMessages = {
  title: "数据导入",
  subtitle: "从 Excel 文件导入记录",
  loading: "导入页面加载中",
} as const;

export const dataImportFormatDescriptionMessages = {
  title: "查看文件格式要求",
  fileTypeHint: "表名需为「收支」「转账」或「余额变更」。",
  unknownColumnHint: "列名要和下方列表完全一致，多出的列会报错。",
  holderColumnHint:
    "每个账户只能填写 0 个（留空）或 1 个持有人姓名；多账户的持有人按分号位置对应，可整格或部分位置留空。",
  recorderColumnHint:
    "「记账人」列不会被读取，导入的记账人统一为当前登录账号。",
  billRefHint:
    "「账单关联」列相同的多行中，除第一次出现的行外，日期、账户、账户持有人、账户币种、账户类型、付款金额、商家、商家分类、备注需填写「-」以继承首次出现那行的值（也可以原样复述该行内容）；同一非空账单关联的收入和支出明细合并为一笔记录，账单关联为空的行各自独立。",
  accountTypeColumnHint: `「账户类型」列（转账表为「转出账户类型」「转入账户类型」）必填，账单关联后续行可填「-」继承首行，可填写：${accountTypeLabelsText}。导入时按账户名称、持有人、币种和账户类型匹配已有账户（账户名称不区分大小写），匹配不到时按填写的类型新建账户。`,
  splitPaymentHint:
    "多账户仅支持全为支出的明细且币种相同。账户、账户持有人、账户类型、付款金额用中文或英文分号按位置对应，个数一致，首尾空格会去掉；付款金额非负（允许 0）、合计等于支出合计，账户不能重复。账户币种只写一个。例：账户「礼品卡；信用卡」、持有人「；小明」、类型「其他；信用卡」、付款金额「2000；1500」，对应金额合计 3500。单账户付款金额必须留空，账户名称本身不能含分号。",
  balanceAdjustmentHint:
    "「余额变更」的金额为带符号差值：正数增加余额，负数减少余额，不能为 0。按收支、转账、余额变更的顺序导入。",
  photoColumnHint:
    "「收支」表末尾可增加「照片1」～「照片5」列，把图片插入对应格子；多行账单仅首行可以有照片。",
  transferAmountHint:
    "跨币种转账必须填写到账金额；同币种可留空或与金额相同。手续费可选，使用转出账户币种。",
  incomeExpenseColumnsTitle: "「收支」表列名（*为必填）",
  balanceAdjustmentColumnsTitle: "「余额变更」表列名（*为必填）",
  transferColumnsTitle: "「转账」表列名（*为必填）",
} as const;

export const dataImportFileFieldMessages = {
  description: "支持 300MB 以内的 Excel 文件，可以直接使用导出的文件。",
  chooseFileButton: "选择文件",
  reselectButton: "重新选择",
  checking: "正在检查…",
  noFileSelected: "尚未选择文件",
} as const;

export const dataImportResultMessages = {
  balanceAdjustmentCountLabel: (count: number) => `余额变更 ${count} 笔`,
  incomeExpenseCountLabel: (count: number) => `收支 ${count} 笔`,
  transferCountLabel: (count: number) => `转账 ${count} 笔`,
  photoCountLabel: (count: number) => `照片 ${count} 张`,
  failureTitle: (count: number) => `有 ${count} 处需要修改`,
  moreIssues: (count: number) => `还有 ${count} 处`,
  structuralTitle: "文件结构",
  successTitle: "可以导入",
  emptySummary: "没有需要导入的记录",
  rowIssue: (rows: number[], reason: string) =>
    `第 ${rows.join("、")} 行：${reason}`,
} as const;

export const dataImportExecutionMessages = {
  startButton: "开始导入",
  importingButton: "正在导入…",
  photoUploadProgress: (done: number, total: number) =>
    `正在上传照片 ${done}/${total}`,
  keepPageOpenHint: "请保持页面打开",
  successTitle: (count: number) => `已导入 ${count} 笔`,
  partialTitle: (success: number, failed: number) =>
    `已导入 ${success} 笔，${failed} 笔未导入`,
  failureTitle: "没有导入任何记录",
  holderMissingCount: (count: number) => `未匹配持有人 ${count} 笔`,
  createdPlaceholderCount: (count: number) => `新建了 ${count} 位待邀请成员`,
} as const;

export const dataImportHolderMappingMessages = {
  title: (count: number) => `有 ${count} 位持有人需要确认对应的成员`,
  cardTitle: (name: string) => `「${name}」`,
  recordCount: (count: number) => `涉及 ${count} 条记录`,
  ambiguousHint: "账本中有多位同名成员，请选择对应的一位",
  selectLabel: "对应到",
  noHolderOption: "无持有人",
  memberGroupLabel: "成员",
  newPlaceholderOption: (name: string) => `新建待邀请成员「${name}」`,
  cancelButton: "取消导入",
  confirmButton: "继续导入",
} as const;

/** 导入文件「账户类型」列（含转账表的转出 / 转入账户类型）的行校验错误。 */
export const dataImportAccountTypeMessages = {
  required: (column: string) =>
    `${column}不能为空，请填写：${accountTypeLabelsText}。`,
  invalid: (column: string, value: string) =>
    `${column}「${value}」无法识别，请填写：${accountTypeLabelsText}。`,
} as const;
