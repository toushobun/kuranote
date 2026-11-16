/**
 * 同一笔原支出关联从草稿切换时，只允许本行曾自动带出的值跟随。
 * undefined：未自动带出，可在目标字段尚空时首次补全；
 * null：用户已手动修改，后续即使清空或改回原值也不覆盖；
 * string：最后一次自动写入的值，仅在真正换原支出时允许跟随。
 */
export function shouldFollowLinkedField(
  currentValue: string | undefined,
  lastAutomaticValue: string | null | undefined,
  targetChanged: boolean,
) {
  if (lastAutomaticValue === null) return false;
  if (lastAutomaticValue === undefined) return !currentValue;
  return targetChanged && currentValue === lastAutomaticValue;
}
