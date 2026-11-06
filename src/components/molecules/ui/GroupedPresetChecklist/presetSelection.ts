/** 按项目顺序返回可选的已勾选项目，重复 key 只保留一次。 */
export function getPresetSelection(
  items: readonly { key: string }[],
  selectedKeys: readonly string[],
  disabledKeys: readonly string[] = [],
) {
  const disabled = new Set(disabledKeys);
  const selected = new Set(selectedKeys);
  return [...new Set(items.map(({ key }) => key))].filter(
    (key) => selected.has(key) && !disabled.has(key),
  );
}
