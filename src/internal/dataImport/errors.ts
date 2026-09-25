export const dataImportErrorCodes = {
  executionFailed: "execution_failed",
  executionInvalid: "execution_invalid",
  fileTooLarge: "file_too_large",
  holderMappingConflict: "holder_mapping_conflict",
  ledgerInvalid: "ledger_invalid",
  referenceInvalid: "reference_invalid",
  validationFailed: "validation_failed",
} as const;

export type DataImportErrorCode =
  (typeof dataImportErrorCodes)[keyof typeof dataImportErrorCodes];

const dataImportErrorMessages: Record<DataImportErrorCode, string> = {
  [dataImportErrorCodes.executionFailed]: "数据导入失败，请稍后重试。",
  [dataImportErrorCodes.executionInvalid]:
    "导入文件或进度信息已变化，请重新检查格式后再导入。",
  [dataImportErrorCodes.fileTooLarge]: "文件大小不能超过 50MB。",
  [dataImportErrorCodes.holderMappingConflict]:
    "持有人映射与账本当前的成员或待邀请成员冲突，请重新检查后再导入。",
  [dataImportErrorCodes.ledgerInvalid]: "账本不存在、已停用或您无法访问。",
  [dataImportErrorCodes.referenceInvalid]: "导入数据引用的基础资料不正确。",
  [dataImportErrorCodes.validationFailed]: "文件检查失败，请稍后重试。",
};

export const balanceAdjustmentImportErrorMessages = {
  typeInvalid: "交易类型必须是「余额变更」。",
  dateInvalid: "日期格式不正确，应为 YYYY-MM-DD HH:MM:SS。",
  accountRequired: "账户不能为空。",
  currencyInvalid: "账户币种必须是 3 位字母代码，例如 CNY。",
  amountInvalid: "金额必须是非零、绝对值小于 1 万亿且不超过两位小数的数字。",
  holderInvalid:
    "账户持有人只能填写 0 个或 1 个持有人姓名，不支持填写多个持有人。",
} as const;

export const dataImportExecutionErrorMessages = {
  accountAmbiguous: (name: string) =>
    `账本内存在多个名称、持有人和币种都相同的账户「${name}」，无法确定应使用哪一个。`,
  childCategoryRequired: (parentName: string) =>
    `一级分类「${parentName}」没有填写二级分类；当前交易记录必须使用二级分类。`,
  duplicateWarning: "疑似与现有记录重复，但已继续导入。",
  holderAmbiguous: (name: string) =>
    `账本内存在多个显示名为「${name}」的成员，无法确定账户持有人。`,
  holderMappingInvalid:
    "持有人映射里包含不属于当前账本的成员或待邀请成员（可能已加入账本或已被删除），请重新检查格式后再导入。",
  newPlaceholderMemberConflict: (names: string[]) =>
    names.length > 0
      ? `「${names.join("」「")}」与账本成员同名，不能新建为待邀请成员，请在持有人映射里改为选择该成员。`
      : "要新建的待邀请成员与账本成员同名，请在持有人映射里改为选择该成员。",
  newPlaceholderNameConflict:
    "账本里已有同名的待邀请成员，请在持有人映射里直接选择那位待邀请成员。",
  holderMissingWarning: (name: string) =>
    `账本内找不到显示名为「${name}」的有效成员，已按无持有人继续导入该笔记录。`,
  merchantAmbiguous: (name: string) =>
    `账本内存在多个可匹配「${name}」的商家，无法确定应使用哪一个。`,
  rowFailed: "该条记录导入失败，请稍后重试。",
} as const;

export function getDataImportErrorMessage(code?: string) {
  return code && code in dataImportErrorMessages
    ? dataImportErrorMessages[code as DataImportErrorCode]
    : null;
}
