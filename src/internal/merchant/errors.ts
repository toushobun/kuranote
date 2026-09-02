export const merchantErrorCodes = {
  aliasArchiveFailed: "alias_archive_failed",
  aliasCreateFailed: "alias_create_failed",
  aliasInvalid: "alias_invalid",
  aliasPreferredUpdateFailed: "alias_preferred_update_failed",
  aliasRequired: "alias_required",
  aliasTooLong: "alias_too_long",
  archiveFailed: "archive_failed",
  authRequired: "auth_required",
  createFailed: "create_failed",
  ledgerInvalid: "ledger_invalid",
  merchantAliasListFailed: "merchant_alias_list_failed",
  merchantAliasReadFailed: "merchant_alias_read_failed",
  merchantIconFetchFailed: "merchant_icon_fetch_failed",
  merchantIconRedirectInvalid: "merchant_icon_redirect_invalid",
  merchantInvalid: "merchant_invalid",
  merchantListFailed: "merchant_list_failed",
  merchantReadFailed: "merchant_read_failed",
  merchantTagArchiveFailed: "merchant_tag_archive_failed",
  merchantTagCreateFailed: "merchant_tag_create_failed",
  merchantTagIconInvalid: "merchant_tag_icon_invalid",
  merchantTagInvalid: "merchant_tag_invalid",
  merchantTagListFailed: "merchant_tag_list_failed",
  merchantTagNameRequired: "merchant_tag_name_required",
  merchantTagNameTooLong: "merchant_tag_name_too_long",
  merchantTagOrderInvalid: "merchant_tag_order_invalid",
  merchantTagReorderFailed: "merchant_tag_reorder_failed",
  merchantTagSetInvalid: "merchant_tag_set_invalid",
  merchantTagUpdateFailed: "merchant_tag_update_failed",
  nameRequired: "name_required",
  nameTooLong: "name_too_long",
  noteTooLong: "note_too_long",
  permissionDenied: "permission_denied",
  updateFailed: "update_failed",
  websiteUrlInvalid: "website_url_invalid",
} as const;

export type MerchantErrorCode =
  (typeof merchantErrorCodes)[keyof typeof merchantErrorCodes];

export type MerchantValidationErrorCode =
  | typeof merchantErrorCodes.aliasInvalid
  | typeof merchantErrorCodes.aliasRequired
  | typeof merchantErrorCodes.aliasTooLong
  | typeof merchantErrorCodes.merchantInvalid
  | typeof merchantErrorCodes.merchantTagIconInvalid
  | typeof merchantErrorCodes.merchantTagInvalid
  | typeof merchantErrorCodes.merchantTagNameRequired
  | typeof merchantErrorCodes.merchantTagNameTooLong
  | typeof merchantErrorCodes.merchantTagOrderInvalid
  | typeof merchantErrorCodes.nameRequired
  | typeof merchantErrorCodes.nameTooLong
  | typeof merchantErrorCodes.noteTooLong
  | typeof merchantErrorCodes.websiteUrlInvalid;

export type MerchantActionErrorCode =
  | MerchantValidationErrorCode
  | typeof merchantErrorCodes.aliasArchiveFailed
  | typeof merchantErrorCodes.aliasCreateFailed
  | typeof merchantErrorCodes.aliasPreferredUpdateFailed
  | typeof merchantErrorCodes.archiveFailed
  | typeof merchantErrorCodes.authRequired
  | typeof merchantErrorCodes.createFailed
  | typeof merchantErrorCodes.ledgerInvalid
  | typeof merchantErrorCodes.merchantIconFetchFailed
  | typeof merchantErrorCodes.merchantIconRedirectInvalid
  | typeof merchantErrorCodes.merchantTagArchiveFailed
  | typeof merchantErrorCodes.merchantTagCreateFailed
  | typeof merchantErrorCodes.merchantTagReorderFailed
  | typeof merchantErrorCodes.merchantTagSetInvalid
  | typeof merchantErrorCodes.merchantTagUpdateFailed
  | typeof merchantErrorCodes.permissionDenied
  | typeof merchantErrorCodes.updateFailed;

const merchantActionErrorCodeSet = new Set<string>([
  merchantErrorCodes.aliasArchiveFailed,
  merchantErrorCodes.aliasCreateFailed,
  merchantErrorCodes.aliasInvalid,
  merchantErrorCodes.aliasPreferredUpdateFailed,
  merchantErrorCodes.aliasRequired,
  merchantErrorCodes.aliasTooLong,
  merchantErrorCodes.archiveFailed,
  merchantErrorCodes.authRequired,
  merchantErrorCodes.createFailed,
  merchantErrorCodes.ledgerInvalid,
  merchantErrorCodes.merchantInvalid,
  merchantErrorCodes.merchantIconFetchFailed,
  merchantErrorCodes.merchantIconRedirectInvalid,
  merchantErrorCodes.merchantTagArchiveFailed,
  merchantErrorCodes.merchantTagCreateFailed,
  merchantErrorCodes.merchantTagIconInvalid,
  merchantErrorCodes.merchantTagInvalid,
  merchantErrorCodes.merchantTagNameRequired,
  merchantErrorCodes.merchantTagNameTooLong,
  merchantErrorCodes.merchantTagOrderInvalid,
  merchantErrorCodes.merchantTagReorderFailed,
  merchantErrorCodes.merchantTagSetInvalid,
  merchantErrorCodes.merchantTagUpdateFailed,
  merchantErrorCodes.nameRequired,
  merchantErrorCodes.nameTooLong,
  merchantErrorCodes.noteTooLong,
  merchantErrorCodes.permissionDenied,
  merchantErrorCodes.updateFailed,
  merchantErrorCodes.websiteUrlInvalid,
]);

const merchantErrorMessages: Record<MerchantErrorCode, string> = {
  [merchantErrorCodes.aliasArchiveFailed]: "商家别名归档失败，请稍后重试。",
  [merchantErrorCodes.aliasCreateFailed]:
    "商家别名新增失败。请确认别名是否重复，或稍后重试。",
  [merchantErrorCodes.aliasInvalid]: "商家别名指定不正确。",
  [merchantErrorCodes.aliasPreferredUpdateFailed]:
    "展示名更新失败，请稍后重试。",
  [merchantErrorCodes.aliasRequired]: "请输入商家别名。",
  [merchantErrorCodes.aliasTooLong]: "商家别名不能超过 100 个字符。",
  [merchantErrorCodes.archiveFailed]: "商家归档失败，请稍后重试。",
  [merchantErrorCodes.authRequired]: "请先登录。",
  [merchantErrorCodes.createFailed]:
    "商家新增失败。请确认商家名称是否重复，或稍后重试。",
  [merchantErrorCodes.ledgerInvalid]: "账本不存在、已停用或您无法访问。",
  [merchantErrorCodes.merchantAliasListFailed]:
    "商家别名列表加载失败，请稍后重试。",
  [merchantErrorCodes.merchantAliasReadFailed]:
    "商家别名读取失败，请稍后重试。",
  [merchantErrorCodes.merchantIconFetchFailed]:
    "未能获取网站图标，请确认网址后重试。",
  [merchantErrorCodes.merchantIconRedirectInvalid]:
    "网站图标来源验证失败，请稍后重试。",
  [merchantErrorCodes.merchantInvalid]: "商家指定不正确。",
  [merchantErrorCodes.merchantListFailed]: "商家列表加载失败，请稍后重试。",
  [merchantErrorCodes.merchantReadFailed]: "商家信息读取失败，请稍后重试。",
  [merchantErrorCodes.merchantTagArchiveFailed]: "标签归档失败，请稍后重试。",
  [merchantErrorCodes.merchantTagCreateFailed]:
    "标签新增失败。请确认标签名称是否重复，或稍后重试。",
  [merchantErrorCodes.merchantTagIconInvalid]: "请选择标签图标。",
  [merchantErrorCodes.merchantTagInvalid]: "该商家标签不存在或已不可用。",
  [merchantErrorCodes.merchantTagListFailed]: "商家标签加载失败，请稍后重试。",
  [merchantErrorCodes.merchantTagNameRequired]: "请输入标签名称。",
  [merchantErrorCodes.merchantTagNameTooLong]: "标签名称不能超过 100 个字符。",
  [merchantErrorCodes.merchantTagOrderInvalid]: "标签排序内容不正确。",
  [merchantErrorCodes.merchantTagReorderFailed]:
    "标签排序保存失败，请稍后重试。",
  [merchantErrorCodes.merchantTagSetInvalid]:
    "标签列表已发生变化，请刷新页面后重试。",
  [merchantErrorCodes.merchantTagUpdateFailed]:
    "标签更新失败。请确认标签名称是否重复，或稍后重试。",
  [merchantErrorCodes.nameRequired]: "请输入商家名称。",
  [merchantErrorCodes.nameTooLong]: "商家名称不能超过 100 个字符。",
  [merchantErrorCodes.noteTooLong]: "备注不能超过 1000 个字符。",
  [merchantErrorCodes.permissionDenied]: "只有账本所有者或管理员可以维护商家。",
  [merchantErrorCodes.updateFailed]:
    "商家更新失败。请确认商家名称是否重复，或稍后重试。",
  [merchantErrorCodes.websiteUrlInvalid]:
    "商家网址必须以 http:// 或 https:// 开头。",
};

export function isMerchantActionErrorCode(
  value: string,
): value is MerchantActionErrorCode {
  return merchantActionErrorCodeSet.has(value);
}

export function getMerchantActionErrorMessage(error: MerchantErrorCode) {
  return isMerchantActionErrorCode(error) ? merchantErrorMessages[error] : null;
}

export function getMerchantErrorMessage(error: MerchantErrorCode) {
  return merchantErrorMessages[error];
}
