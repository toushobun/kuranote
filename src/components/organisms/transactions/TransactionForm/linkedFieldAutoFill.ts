/**
 * 曾由本行自动带出的字段，仅在确认换原支出时跟随（不受手动修改影响）；
 * 未自动带出过的字段，只有首次允许补全且当前为空时才能写入。
 */
export function shouldFollowLinkedField(
  currentValue: string | undefined,
  wasAutoFilled: boolean | undefined,
  targetChanged: boolean,
  canFirstAutoFill: boolean,
) {
  return wasAutoFilled
    ? targetChanged
    : canFirstAutoFill && !currentValue;
}
