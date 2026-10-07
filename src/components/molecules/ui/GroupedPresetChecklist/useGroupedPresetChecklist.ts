"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import type {
  GroupedPresetChecklistGroup,
  GroupedPresetChecklistItem,
} from "./GroupedPresetChecklist";

type UseGroupedPresetChecklistOptions = {
  groups: readonly GroupedPresetChecklistGroup[];
  items: readonly GroupedPresetChecklistItem[];
  onChange: (selectedKeys: string[]) => void;
  selectedKeys: readonly string[];
};

/**
 * 两层预设勾选的状态与派生数据。勾选以项目为单位，分组勾选只是对其下项目的批量操作，
 * 因此同一项目出现在多个分组时勾选状态自然联动。
 */
export function useGroupedPresetChecklist({
  groups,
  items,
  onChange,
  selectedKeys,
}: UseGroupedPresetChecklistOptions) {
  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // 分组 → 项目的映射只在 groups / items 变化时计算，勾选时不重复计算。
  const groupItems = useMemo(() => {
    const itemByKey = new Map(items.map((item) => [item.key, item]));
    return new Map(
      groups.map((group) => [
        group.key,
        group.itemKeys
          .map((key) => itemByKey.get(key))
          .filter((item): item is GroupedPresetChecklistItem => !!item),
      ]),
    );
  }, [groups, items]);

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  // 回调读取最新的勾选与 onChange，使回调保持稳定，memo 化的行在勾选未变化时不重新渲染。
  const latestRef = useRef({ items, onChange, selectedSet });
  useLayoutEffect(() => {
    latestRef.current = { items, onChange, selectedSet };
  });

  /** 将 keys 全部设为 checked。输出按 items 的顺序排列，保证结果稳定。 */
  const setItemsChecked = useCallback(
    (keys: readonly string[], checked: boolean) => {
      const latest = latestRef.current;
      const next = new Set(latest.selectedSet);
      for (const key of keys) {
        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
      }
      latest.onChange(
        latest.items.filter(({ key }) => next.has(key)).map(({ key }) => key),
      );
    },
    [],
  );

  const toggleExpanded = useCallback((groupKey: string) => {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  return {
    groups: groups.map((group) => {
      const groupItemList = groupItems.get(group.key) ?? [];
      return {
        expanded: expandedKeys.has(group.key),
        group,
        items: groupItemList,
        selectedCount: groupItemList.filter(({ key }) => selectedSet.has(key))
          .length,
      };
    }),
    selectedSet,
    setItemsChecked,
    toggleExpanded,
  };
}
