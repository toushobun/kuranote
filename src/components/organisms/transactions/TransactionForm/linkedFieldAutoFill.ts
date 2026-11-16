/**
 * 字段未由本行自动带出时，只在字段为空时首次补全；
 * 曾由本行自动带出的字段，仅在确认换原支出时跟随，手动修改不影响资格。
 */
export function shouldFollowLinkedField(
  currentValue: string | undefined,
  wasAutoFilled: boolean | undefined,
  targetChanged: boolean,
) {
  return wasAutoFilled ? targetChanged : !currentValue;
}
