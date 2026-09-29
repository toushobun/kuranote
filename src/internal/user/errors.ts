export const displayNameMaxLength = 100;

export const userErrorMessages = {
  displayNameLedgerInvalid: "账本指定不正确，请刷新页面后重试。",
  displayNameLedgerPermissionDenied:
    "部分账本已无法同步昵称，请刷新页面后重试。",
  displayNameRequired: "请输入昵称。",
  displayNameTooLong: `昵称最多 ${displayNameMaxLength} 个字符。`,
  displayNameUpdateFailed: "昵称保存失败，请稍后重试。",
  ledgerDisplayNamesLoadFailed: "账本昵称加载失败，请稍后重试。",
  transactionColorSchemeInvalid: "请选择有效的收支配色方案。",
  transactionColorSchemeUpdateFailed: "收支配色方案保存失败，请稍后重试。",
  userInactive: "当前用户已停用。",
} as const;

/** 同步账本昵称失败的账本级原因。 */
export const ledgerDisplayNameConflictReasons = {
  display_name_placeholder_conflict: "账本中已有同名的待邀请成员",
} as const;

export type LedgerDisplayNameConflictCode =
  keyof typeof ledgerDisplayNameConflictReasons;

export function isLedgerDisplayNameConflictCode(
  value: unknown,
): value is LedgerDisplayNameConflictCode {
  return (
    typeof value === "string" &&
    Object.hasOwn(ledgerDisplayNameConflictReasons, value)
  );
}

/** 列出每个失败账本及原因，整次修改未保存。 */
export function formatLedgerDisplayNameConflictMessage(
  conflicts: readonly {
    code: LedgerDisplayNameConflictCode;
    ledgerName: string;
  }[],
): string {
  const details = conflicts
    .map(
      ({ code, ledgerName }) =>
        `「${ledgerName}」：${ledgerDisplayNameConflictReasons[code]}`,
    )
    .join("；");

  return `以下账本无法使用该昵称，昵称未修改。${details}。请更换昵称，或取消勾选这些账本。`;
}
