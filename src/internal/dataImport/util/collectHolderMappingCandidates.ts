import type { AccountImportHolder } from "internal/account";
import type { ImportHolderMappingCandidate } from "internal/dataImport/entity/importHolderMapping";
import type { ImportExecutionUnit } from "internal/dataImport/entity/importRow";

function unitHolderNames(unit: ImportExecutionUnit): Set<string> {
  const names =
    unit.kind === "incomeExpense"
      ? [unit.group.items[0].accountHolder]
      : unit.kind === "transfer"
        ? [unit.row.fromAccountHolder, unit.row.toAccountHolder]
        : [unit.row.accountHolder];
  return new Set(names.filter((name): name is string => name !== null));
}

/**
 * 汇总文件里无法唯一匹配账本成员的持有人姓名及涉及记录数，按姓名首次出现的
 * 顺序返回。匹配口径与服务端 `resolveHolder` 保持一致：显示名精确相等，
 * 0 个成员为 `unmatched`，多个成员为 `ambiguous`，恰好 1 个成员不需要映射。
 */
export function collectHolderMappingCandidates(
  units: ImportExecutionUnit[],
  members: AccountImportHolder[],
): ImportHolderMappingCandidate[] {
  const candidates = new Map<string, ImportHolderMappingCandidate>();

  for (const unit of units) {
    for (const name of unitHolderNames(unit)) {
      const existing = candidates.get(name);
      if (existing) {
        existing.recordCount += 1;
        continue;
      }
      const matchCount = members.filter(
        (member) => member.displayName === name,
      ).length;
      if (matchCount !== 1) {
        candidates.set(name, {
          name,
          recordCount: 1,
          reason: matchCount === 0 ? "unmatched" : "ambiguous",
        });
      }
    }
  }

  return [...candidates.values()];
}
