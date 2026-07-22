export const categoryErrorCodes = {
  archiveFailed: "archive_failed",
  categoryInvalid: "category_invalid",
  createFailed: "create_failed",
  iconInvalid: "icon_invalid",
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
