import { useMemo } from "react";

import type { TransactionAccountOption } from "types/transactions";

/**
 * 编辑页的账户选项：并入已归档的记录账户（#962、#966）。
 * 有已归档账户时页面只读，并入后按原账户名称与实际币种显示，不回落到账本默认币种。
 */
export function useEditAccountOptions(
  accountOptions: TransactionAccountOption[],
  archivedAccountOptions: TransactionAccountOption[] | undefined,
) {
  return useMemo(
    () => [...accountOptions, ...(archivedAccountOptions ?? [])],
    [accountOptions, archivedAccountOptions],
  );
}
