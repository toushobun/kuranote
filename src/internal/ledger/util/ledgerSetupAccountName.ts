import type { LedgerSetupDraftAccount } from "internal/ledger/schema/ledgerSetupDraft";

function accountNameScopeKey({
  name,
  type,
}: Pick<LedgerSetupDraftAccount, "name" | "type">) {
  return `${type}\u0000${name.trim().toLowerCase()}`;
}

/**
 * 草稿内账户名称是否重复。唯一范围与 #781 一致（账本 + 名称 + 类型 + 货币 + 持有人）；
 * 向导中货币均为账本默认货币、持有人均为当前用户，因此按「类型 + 名称（忽略大小写）」判断。
 */
export function hasDuplicateLedgerSetupAccountName(
  accounts: readonly LedgerSetupDraftAccount[],
): boolean {
  const keys = accounts.map(accountNameScopeKey);
  return new Set(keys).size !== keys.length;
}

/** 同一类型下是否已有与 account 同名的账户。判断规则与 hasDuplicateLedgerSetupAccountName 相同。 */
export function isLedgerSetupAccountNameTaken(
  accounts: readonly Pick<LedgerSetupDraftAccount, "name" | "type">[],
  account: Pick<LedgerSetupDraftAccount, "name" | "type">,
): boolean {
  const key = accountNameScopeKey(account);
  return accounts.some((item) => accountNameScopeKey(item) === key);
}
