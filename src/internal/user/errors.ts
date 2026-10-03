export const displayNameMaxLength = 100;

/** 头像文件上限，与 avatars bucket 的 file_size_limit 一致。 */
export const avatarMaxFileSize = 1024 * 1024;

/** 头像允许的 MIME 类型，与 avatars bucket 的 allowed_mime_types 一致。 */
export const avatarMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarMimeType = (typeof avatarMimeTypes)[number];

export const userErrorMessages = {
  avatarFileRequired: "请选择头像图片。",
  avatarFileTooLarge: `头像图片不能超过 ${avatarMaxFileSize / 1024 / 1024}MB，请换一张图片后重试。`,
  avatarFileTypeUnsupported: "仅支持 JPEG、PNG 或 WebP 格式的图片。",
  avatarImageUnreadable: "无法读取该图片，请换一张图片后重试。",
  avatarUpdateFailed: "头像更换失败，请稍后重试。",
  avatarUploadFailed: "头像上传失败，请稍后重试。",
  avatarUrlHttpsRequired: "头像地址必须使用 HTTPS。",
  avatarUrlInvalid: "头像地址必须是有效的 HTTPS URL。",
  displayNameLedgerInvalid: "账本指定不正确，请刷新页面后重试。",
  displayNameLedgerPermissionDenied:
    "部分账本已无法同步昵称，请刷新页面后重试。",
  displayNameRequired: "请输入昵称。",
  displayNameTooLong: `昵称最多 ${displayNameMaxLength} 个字符。`,
  displayNameUpdateFailed: "昵称保存失败，请稍后重试。",
  ledgerDisplayNamesLoadFailed: "账本昵称加载失败，请稍后重试。",
  profileInvalid: "用户资料格式异常，请稍后重试。",
  profileLoadFailed: "用户资料加载失败，请稍后重试。",
  profileNotFound: "用户资料不存在。",
  profileUpdateFailed: "用户资料更新失败，请稍后重试。",
  profileUpdateRequired: "请至少提供一项需要更新的用户资料。",
  scopeMismatch: "不能修改其他用户的资料。",
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
