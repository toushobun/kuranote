/** 全部选择与计数只作用于可选项目，按项目顺序去重。 */
export function getPresetSelection(
  items: readonly { key: string }[],
  selectedKeys: readonly string[],
  disabledKeys: readonly string[] = [],
) {
  const disabled = new Set(disabledKeys);
  const selected = new Set(selectedKeys);
  const availableKeys = [...new Set(items.map(({ key }) => key))].filter(
    (key) => !disabled.has(key),
  );
  const keys = availableKeys.filter((key) => selected.has(key));
  const allSelected =
    availableKeys.length > 0 && keys.length === availableKeys.length;
  return {
    allSelected,
    availableKeys,
    keys,
    toggleAllKeys: allSelected ? [] : availableKeys,
  };
}
