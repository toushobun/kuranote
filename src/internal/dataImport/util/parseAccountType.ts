import { dataImportAccountTypeMessages } from "config/dataImportExportMessages";
import { accountTypeOptions, type AccountType } from "internal/account";

export type ParseAccountTypeResult =
  | { ok: true; value: AccountType }
  | { message: string; ok: false };

/**
 * 把「账户类型」列的中文标签（去掉首尾空格后）映射成 `AccountType`。
 * 该列必填：空值或无法识别的值都返回可直接展示的错误，不兜底为「其他」。
 */
export function parseAccountType(
  text: string,
  column: string,
): ParseAccountTypeResult {
  const label = text.trim();
  if (!label) {
    return {
      message: dataImportAccountTypeMessages.required(column),
      ok: false,
    };
  }
  const option = accountTypeOptions.find(
    (candidate) => candidate.label === label,
  );
  return option
    ? { ok: true, value: option.value }
    : {
        message: dataImportAccountTypeMessages.invalid(column, label),
        ok: false,
      };
}
