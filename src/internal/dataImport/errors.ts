export const dataImportErrorCodes = {
  fileRequired: "file_required",
  fileTooLarge: "file_too_large",
  fileTypeUnsupported: "file_type_unsupported",
  ledgerInvalid: "ledger_invalid",
  validationFailed: "validation_failed",
} as const;

export type DataImportErrorCode =
  (typeof dataImportErrorCodes)[keyof typeof dataImportErrorCodes];

const dataImportErrorMessages: Record<DataImportErrorCode, string> = {
  [dataImportErrorCodes.fileRequired]: "请选择要导入的文件。",
  [dataImportErrorCodes.fileTooLarge]: "文件大小不能超过 10MB。",
  [dataImportErrorCodes.fileTypeUnsupported]: "仅支持 xlsx 文件。",
  [dataImportErrorCodes.ledgerInvalid]: "账本不存在、已停用或您无法访问。",
  [dataImportErrorCodes.validationFailed]: "文件检查失败，请稍后重试。",
};

export function getDataImportErrorMessage(code?: string) {
  return code && code in dataImportErrorMessages
    ? dataImportErrorMessages[code as DataImportErrorCode]
    : null;
}
