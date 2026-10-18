import {
  RepositoryError,
  ValidationError,
} from "internal/shared/errors/appError";

export const dataExportErrorMessages = {
  accountSeparator: "账户名称包含分号，无法导出。请修改账户名称后重试。",
  incompleteData:
    "交易数据不完整，无法导出。请刷新后重试；若仍失败，请联系账本管理员。",
  exportFailed: "数据导出失败，请稍后重试。",
  downloadFailed: "文件生成或下载失败，请重试。",
} as const;

export class IncompleteDataExportError extends RepositoryError {
  constructor() {
    super("data_export_incomplete", dataExportErrorMessages.incompleteData);
  }
}

export class AccountSeparatorDataExportError extends ValidationError {
  constructor() {
    super(
      "data_export_account_separator",
      dataExportErrorMessages.accountSeparator,
    );
  }
}
