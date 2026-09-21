"use client";

import { useState } from "react";

import type { AccountImportHolder } from "internal/account";
import type { ImportHolderMapping } from "internal/dataImport";

/**
 * 下拉里「无持有人」对应的选项值；成员选项的值为 userId（UUID，不会冲突）。
 * MUI Select 会把空字符串当作「未选择」而显示空白，因此不能用 "" 表示。
 */
export const noHolderOptionValue = "none";

/** 同名成员之间靠邮箱区分；姓名唯一时只显示姓名。 */
export function getMemberOptionLabel(
  member: AccountImportHolder,
  members: AccountImportHolder[],
) {
  const hasSameName =
    members.filter(({ displayName }) => displayName === member.displayName)
      .length > 1;
  return hasSameName && member.email
    ? `${member.displayName}（${member.email}）`
    : member.displayName;
}

export function useDataImportHolderMapping({
  names,
  onConfirm,
}: {
  names: string[];
  onConfirm: (mapping: ImportHolderMapping) => void;
}) {
  const [selection, setSelection] = useState<Record<string, string>>({});

  function getSelectedValue(name: string) {
    return selection[name] ?? noHolderOptionValue;
  }

  function handleSelectChange(name: string, value: string) {
    setSelection((current) => ({ ...current, [name]: value }));
  }

  function handleConfirm() {
    onConfirm(
      Object.fromEntries(
        names.map((name) => {
          const value = getSelectedValue(name);
          return [name, value === noHolderOptionValue ? null : value];
        }),
      ),
    );
  }

  return { getSelectedValue, handleConfirm, handleSelectChange };
}
