/**
 * 「账户持有人」列格式约定：单元格内只能是空（0 个持有人）或者一个持有人姓名
 * （1 个持有人），不再支持填写多个持有人。原样返回去除首尾空白后的字符串，
 * 不做任何拆分。
 */
export function parseHolderName(cellText: string): string | null {
  const name = cellText.trim();
  return name.length > 0 ? name : null;
}
