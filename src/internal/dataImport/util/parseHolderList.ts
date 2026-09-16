const holderSeparatorPattern = /[;；]/;

/**
 * 「账户持有人」列格式约定：同一单元格内可以填写 0～N 个持有人姓名，
 * 使用英文分号 `;` 或中文分号「；」分隔（不用逗号，避免与 CSV 常规分隔符、
 * 姓名中可能出现的顿号/逗号冲突）。空单元格代表 0 个持有人，
 * 呼应 #763 账户已放开为 0～N 个持有人的模型。
 *
 * 返回去除首尾空白、过滤空项、按去重后的姓名集合（顺序不敏感，
 * 后续按「账户名 + 持有人集合」整体匹配 / 创建账户）。
 */
export function parseHolderList(cellText: string): string[] {
  const names = cellText
    .split(holderSeparatorPattern)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  return [...new Set(names)];
}

/** 判断两个持有人集合是否代表同一组持有人（顺序无关，去重后比较）。 */
export function isSameHolderSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const setA = new Set(a);
  return b.every((name) => setA.has(name));
}
