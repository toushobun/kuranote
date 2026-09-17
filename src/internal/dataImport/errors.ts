export const dataImportErrorCodes = {
  executionFailed: "execution_failed",
  executionInvalid: "execution_invalid",
  fileRequired: "file_required",
  fileTooLarge: "file_too_large",
  fileTypeUnsupported: "file_type_unsupported",
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
  [dataImportErrorCodes.fileRequired]: "请选择要导入的文件。",
  [dataImportErrorCodes.fileTooLarge]: "文件大小不能超过 10MB。",
  [dataImportErrorCodes.fileTypeUnsupported]: "仅支持 xlsx 文件。",
  [dataImportErrorCodes.ledgerInvalid]: "账本不存在、已停用或您无法访问。",
  [dataImportErrorCodes.referenceInvalid]: "导入数据引用的基础资料不正确。",
  [dataImportErrorCodes.validationFailed]: "文件检查失败，请稍后重试。",
};

export const dataImportExecutionErrorMessages = {
  accountAmbiguous: (name: string) =>
    `账本内存在多个名称和持有人都相同的账户「${name}」，无法确定应使用哪一个。`,
  accountCurrencyMismatch: (name: string, expected: string, actual: string) =>
    `账户「${name}」已存在，但币种为 ${actual}，与导入文件中的 ${expected} 不一致。`,
  childCategoryRequired: (parentName: string) =>
    `一级分类「${parentName}」没有填写二级分类；当前交易记录必须使用二级分类。`,
  duplicateWarning: "疑似与现有记录重复，但已继续导入。",
  holderAmbiguous: (name: string) =>
    `账本内存在多个显示名为「${name}」的成员，无法确定账户持有人。`,
  holderNotFound: (name: string) =>
    `账本内找不到显示名为「${name}」的有效成员，无法设置账户持有人。`,
  merchantAmbiguous: (name: string) =>
    `账本内存在多个可匹配「${name}」的商家，无法确定应使用哪一个。`,
  rowFailed: "该条记录导入失败，请稍后重试。",
} as const;

export function getDataImportErrorMessage(code?: string) {
  return code && code in dataImportErrorMessages
    ? dataImportErrorMessages[code as DataImportErrorCode]
    : null;
}
