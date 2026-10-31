import type { AccountPlaceholderHolderOption } from "types/accounts";

export type AccountHolderSelectionKind = "member" | "placeholder";

/** 三态持有人：真实成员 / 待邀请成员（占位）/ 未选择即无持有人，最多选 1 个。 */
export type AccountHolderSelection = {
  id: string;
  kind: AccountHolderSelectionKind;
} | null;

/** 按表单初始值求初始选择：占位优先，其次是候选里的第一个已选成员。 */
export function getInitialAccountHolderSelection({
  holderUserIds,
  placeholderOptions,
  selectedPlaceholderId,
  selectedUserIds,
}: {
  holderUserIds: string[];
  placeholderOptions: AccountPlaceholderHolderOption[];
  selectedPlaceholderId: string | null;
  selectedUserIds: string[];
}): AccountHolderSelection {
  if (
    selectedPlaceholderId &&
    placeholderOptions.some(
      (option) => option.placeholder_id === selectedPlaceholderId,
    )
  ) {
    return { id: selectedPlaceholderId, kind: "placeholder" };
  }

  const userId = holderUserIds.find((id) => selectedUserIds.includes(id));
  return userId ? { id: userId, kind: "member" } : null;
}

export function isAccountHolderSelected(
  selection: AccountHolderSelection,
  kind: AccountHolderSelectionKind,
  id: string,
) {
  return selection?.kind === kind && selection.id === id;
}

/** 点已选中项取消选择，点其他项切换过去。 */
export function toggleAccountHolderSelection(
  selection: AccountHolderSelection,
  kind: AccountHolderSelectionKind,
  id: string,
): AccountHolderSelection {
  return isAccountHolderSelected(selection, kind, id) ? null : { id, kind };
}
