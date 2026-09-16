export type ParseHolderNameResult =
  | { ok: false }
  | { ok: true; value: string | null };

const holderSeparatorPattern = /[;；]/;

/**
 * 「账户持有人」列格式约定：单元格内只能是空（0 个持有人）或者一个持有人姓名
 * （1 个持有人），不再支持填写多个持有人。检测到英文/中文分号（历史上用于
 * 分隔多个持有人的分隔符）时判定为格式错误，提示用户只能填写一个持有人。
 */
export function parseHolderName(cellText: string): ParseHolderNameResult {
  const name = cellText.trim();

  if (holderSeparatorPattern.test(name)) {
    return { ok: false };
  }

  return { ok: true, value: name.length > 0 ? name : null };
}
