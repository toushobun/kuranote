export const categoryErrorCodes = {
  archiveFailed: "archive_failed",
  categoryInvalid: "category_invalid",
  createFailed: "create_failed",
  iconInvalid: "icon_invalid",
  ledgerInvalid: "ledger_invalid",
  nameRequired: "name_required",
  nameTooLong: "name_too_long",
  orderInvalid: "order_invalid",
  parentInvalid: "parent_invalid",
  permissionDenied: "permission_denied",
  reorderConflict: "reorder_conflict",
  reorderFailed: "reorder_failed",
  typeInvalid: "type_invalid",
  updateFailed: "update_failed",
} as const;

export type CategoryErrorCode =
  (typeof categoryErrorCodes)[keyof typeof categoryErrorCodes];

export type CategoryValidationErrorCode =
  | typeof categoryErrorCodes.categoryInvalid
  | typeof categoryErrorCodes.iconInvalid
  | typeof categoryErrorCodes.nameRequired
  | typeof categoryErrorCodes.nameTooLong
  | typeof categoryErrorCodes.orderInvalid
  | typeof categoryErrorCodes.parentInvalid
  | typeof categoryErrorCodes.typeInvalid;

export const categoryErrorMessages: Record<CategoryErrorCode, string> = {
  [categoryErrorCodes.archiveFailed]: "分类归档失败。",
  [categoryErrorCodes.categoryInvalid]: "分类指定不正确。",
  [categoryErrorCodes.createFailed]:
    "分类新增失败。请确认分类名称是否重复，或稍后重试。",
  [categoryErrorCodes.iconInvalid]: "请选择图标库中的分类图标。",
  [categoryErrorCodes.ledgerInvalid]: "账本不存在或已归档。",
  [categoryErrorCodes.nameRequired]: "请输入分类名称。",
  [categoryErrorCodes.nameTooLong]: "分类名称不能超过 100 个字符。",
  [categoryErrorCodes.orderInvalid]: "分类排序内容不正确。",
  [categoryErrorCodes.parentInvalid]: "大分类指定不正确。",
  [categoryErrorCodes.permissionDenied]: "只有账本所有者或管理员可以维护分类。",
  [categoryErrorCodes.reorderConflict]:
    "分类列表已发生变化，请刷新页面后重试。",
  [categoryErrorCodes.reorderFailed]: "分类排序保存失败，请稍后重试。",
  [categoryErrorCodes.typeInvalid]: "分类类型不正确。",
  [categoryErrorCodes.updateFailed]:
    "分类更新失败。请确认分类名称是否重复，或稍后重试。",
};

export function getCategoryErrorMessage(error?: string) {
  return error
    ? (categoryErrorMessages[error as CategoryErrorCode] ?? null)
    : null;
}

/** 分类读取查询失败时的文案。 */
export const categoryLoadErrorMessages = {
  categoriesLoadFailed: "分类加载失败，请稍后重试。",
  parentLoadFailed: "大分类加载失败，请稍后重试。",
  siblingsLoadFailed: "同级分类加载失败，请稍后重试。",
  summariesLoadFailed: "分类信息加载失败，请稍后重试。",
} as const;

/** 分类写入查询失败时的文案。 */
export const categoryWriteErrorMessages = {
  archiveFailed: "分类归档失败，请稍后重试。",
  createFailed: "分类创建失败，请稍后重试。",
  updateFailed: "分类更新失败，请稍后重试。",
} as const;

/** Action 与 Service 共用的兜底文案（没有更具体的错误时使用） */
export const categoryFallbackErrorMessages = {
  createFailed: "分类新增失败，请稍后重试。",
  inputInvalid: "分类信息不正确，请确认后重试。",
  operationFailed: "分类操作失败，请稍后重试。",
  permissionDenied: "没有权限维护分类。",
  stateChanged: "分类状态已变化，请刷新后重试。",
} as const;
