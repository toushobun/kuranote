"use client";

import { useState } from "react";

import type { AccountImportHolder } from "internal/account";
import type {
  ImportHolderMapping,
  ImportHolderMappingCandidate,
  ImportHolderMappingValue,
} from "internal/dataImport";
import {
  ledgerPlaceholderMemberNameMaxLength,
  type LedgerPlaceholderMemberSummary,
} from "internal/ledger";

/**
 * 下拉选项值。MUI Select 会把空字符串当作「未选择」而显示空白，因此「无持有人」
 * 不能用 ""；成员与待邀请成员的值带种类前缀，避免两种 ID 混用。
 */
export const noHolderOptionValue = "none";
export const newPlaceholderOptionValue = "newPlaceholder";
const memberOptionPrefix = "member:";
const placeholderOptionPrefix = "placeholder:";

export function memberOptionValue(userId: string) {
  return `${memberOptionPrefix}${userId}`;
}

export function placeholderOptionValue(placeholderId: string) {
  return `${placeholderOptionPrefix}${placeholderId}`;
}

function toMappingValue(name: string, value: string): ImportHolderMappingValue {
  if (value === newPlaceholderOptionValue) {
    return { displayName: name, kind: "newPlaceholder" };
  }
  if (value.startsWith(memberOptionPrefix)) {
    return { kind: "member", userId: value.slice(memberOptionPrefix.length) };
  }
  if (value.startsWith(placeholderOptionPrefix)) {
    return {
      kind: "placeholder",
      placeholderId: value.slice(placeholderOptionPrefix.length),
    };
  }
  return { kind: "none" };
}

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

/** 与文件姓名同名的待邀请成员排在最前方便选择，但不会被自动选中。 */
export function sortPlaceholdersForName(
  placeholders: LedgerPlaceholderMemberSummary[],
  name: string,
) {
  return [
    ...placeholders.filter(({ displayName }) => displayName === name),
    ...placeholders.filter(({ displayName }) => displayName !== name),
  ];
}

/**
 * 是否提供「新建待邀请成员」：只对 owner/admin 显示；同名成员不止一个的姓名
 * 新建必然与成员重名，超过长度上限的姓名无法作为名字，都不提供。已有同名
 * 待邀请成员时直接选择它即可，也不再提供新建。
 */
export function canCreatePlaceholderFor(
  candidate: ImportHolderMappingCandidate,
  {
    canCreatePlaceholders,
    placeholders,
  }: {
    canCreatePlaceholders: boolean;
    placeholders: LedgerPlaceholderMemberSummary[];
  },
) {
  return (
    canCreatePlaceholders &&
    candidate.reason !== "ambiguous" &&
    candidate.name.length <= ledgerPlaceholderMemberNameMaxLength &&
    !placeholders.some(({ displayName }) => displayName === candidate.name)
  );
}

export function useDataImportHolderMapping({
  names,
  onConfirm,
}: {
  names: string[];
  onConfirm: (mapping: ImportHolderMapping) => void;
}) {
  // 只保存在浏览器本地；选择「新建待邀请成员」不会调用任何创建接口。
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
        names.map((name) => [
          name,
          toMappingValue(name, getSelectedValue(name)),
        ]),
      ),
    );
  }

  return { getSelectedValue, handleConfirm, handleSelectChange };
}
