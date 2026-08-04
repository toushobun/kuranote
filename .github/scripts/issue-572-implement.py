from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}: {old[:80]!r}")
    write(path, content.replace(old, new, 1))


def replace_all(path: str, old: str, new: str, minimum: int = 1) -> None:
    content = read(path)
    count = content.count(old)
    if count < minimum:
        raise RuntimeError(f"{path}: expected at least {minimum} matches, found {count}: {old[:80]!r}")
    write(path, content.replace(old, new))


# ---------------------------------------------------------------------------
# 共享分摊算法与公开契约
# ---------------------------------------------------------------------------
write(
    "src/internal/transaction/util/refundAllocation.ts",
    r'''export type TransactionRefundAllocation = {
  refundAmount: number;
  refundedItemId: string;
};

export type TransactionRefundAllocationTarget = {
  id: string;
  remainingRefundableAmount: string;
};

/**
 * 以 0.01 为最小货币单位，按剩余可退金额比例分摊。
 *
 * 先向下取整，再按小数余数从大到小补齐尾差；余数相同时按明细 ID
 * 升序处理，因此同一组输入始终得到相同结果。无法保证每条分摊都大于
 * 0、退款总额超过剩余可退合计或输入不合法时返回 null。
 */
export function allocateRefundAmount(
  totalAmount: number | string,
  targets: TransactionRefundAllocationTarget[],
): TransactionRefundAllocation[] | null {
  const totalUnits = toMinorUnits(totalAmount);
  if (totalUnits === null || totalUnits <= 0n || targets.length === 0) {
    return null;
  }

  const sortedTargets = [...targets].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  if (new Set(sortedTargets.map((target) => target.id)).size !== targets.length) {
    return null;
  }

  const targetUnits = sortedTargets.map((target) => ({
    id: target.id,
    units: toMinorUnits(target.remainingRefundableAmount),
  }));
  if (targetUnits.some((target) => target.units === null || target.units <= 0n)) {
    return null;
  }

  const normalizedTargets = targetUnits as { id: string; units: bigint }[];
  const totalRemainingUnits = normalizedTargets.reduce(
    (sum, target) => sum + target.units,
    0n,
  );
  if (totalUnits > totalRemainingUnits) return null;

  const provisional = normalizedTargets.map((target) => {
    const numerator = totalUnits * target.units;
    return {
      allocatedUnits: numerator / totalRemainingUnits,
      id: target.id,
      remainder: numerator % totalRemainingUnits,
      remainingUnits: target.units,
    };
  });
  const allocatedBaseUnits = provisional.reduce(
    (sum, target) => sum + target.allocatedUnits,
    0n,
  );
  let tailUnits = totalUnits - allocatedBaseUnits;
  const tailOrder = [...provisional].sort(
    (left, right) =>
      compareBigInt(right.remainder, left.remainder) ||
      left.id.localeCompare(right.id),
  );

  for (const target of tailOrder) {
    if (tailUnits === 0n) break;
    target.allocatedUnits += 1n;
    tailUnits -= 1n;
  }

  if (
    tailUnits !== 0n ||
    provisional.some(
      (target) =>
        target.allocatedUnits <= 0n ||
        target.allocatedUnits > target.remainingUnits,
    )
  ) {
    return null;
  }

  return provisional
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((target) => ({
      refundAmount: Number(target.allocatedUnits) / 100,
      refundedItemId: target.id,
    }));
}

function toMinorUnits(value: number | string): bigint | null {
  const text = String(value).trim();
  const match = text.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const whole = match[1];
  const fraction = (match[2] ?? "").padEnd(2, "0");
  try {
    return BigInt(whole) * 100n + BigInt(fraction);
  } catch {
    return null;
  }
}

function compareBigInt(left: bigint, right: bigint) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
''',
)

write(
    "src/internal/transaction/util/refundAllocation.test.ts",
    r'''import { describe, expect, it } from "vitest";

import { allocateRefundAmount } from "./refundAllocation";

describe("allocateRefundAmount", () => {
  it("按剩余可退金额比例分摊", () => {
    expect(
      allocateRefundAmount("25", [
        { id: "b", remainingRefundableAmount: "30" },
        { id: "a", remainingRefundableAmount: "20" },
      ]),
    ).toEqual([
      { refundedItemId: "a", refundAmount: 10 },
      { refundedItemId: "b", refundAmount: 15 },
    ]);
  });

  it("按稳定顺序处理最小货币单位尾差", () => {
    expect(
      allocateRefundAmount("100", [
        { id: "c", remainingRefundableAmount: "100" },
        { id: "a", remainingRefundableAmount: "100" },
        { id: "b", remainingRefundableAmount: "100" },
      ]),
    ).toEqual([
      { refundedItemId: "a", refundAmount: 33.34 },
      { refundedItemId: "b", refundAmount: 33.33 },
      { refundedItemId: "c", refundAmount: 33.33 },
    ]);
  });

  it("拒绝超过剩余可退合计的退款", () => {
    expect(
      allocateRefundAmount("10.01", [
        { id: "a", remainingRefundableAmount: "5" },
        { id: "b", remainingRefundableAmount: "5" },
      ]),
    ).toBeNull();
  });

  it("拒绝会产生零金额分摊的选择", () => {
    expect(
      allocateRefundAmount("0.01", [
        { id: "a", remainingRefundableAmount: "1" },
        { id: "b", remainingRefundableAmount: "1" },
      ]),
    ).toBeNull();
  });

  it("拒绝重复目标明细", () => {
    expect(
      allocateRefundAmount("1", [
        { id: "a", remainingRefundableAmount: "1" },
        { id: "a", remainingRefundableAmount: "1" },
      ]),
    ).toBeNull();
  });
});
''',
)

replace_once(
    "src/internal/transaction/index.ts",
    'export type { TransactionReimbursementCandidate } from "internal/transaction/entity/transactionReimbursement";\n',
    'export type { TransactionReimbursementCandidate } from "internal/transaction/entity/transactionReimbursement";\n'
    'export {\n'
    '  allocateRefundAmount,\n'
    '  type TransactionRefundAllocation,\n'
    '  type TransactionRefundAllocationTarget,\n'
    '} from "internal/transaction/util/refundAllocation";\n',
)

replace_once(
    "src/types/transactions.ts",
    "  TransactionBusinessStatus,\n",
    "  TransactionBusinessStatus,\n  TransactionRefundAllocation,\n",
)
replace_once(
    "src/types/transactions.ts",
    "export type { TransactionBusinessStatus };\n",
    "export type { TransactionBusinessStatus, TransactionRefundAllocation };\n",
)

# ---------------------------------------------------------------------------
# 表单输入、Service、Repository 契约
# ---------------------------------------------------------------------------
replace_once(
    "src/internal/transaction/schema.ts",
    'import { getFormText } from "utils/formData";\n',
    'import { getFormText } from "utils/formData";\n'
    'import type { TransactionRefundAllocation } from "internal/transaction/util/refundAllocation";\n',
)
replace_once(
    "src/internal/transaction/schema.ts",
    "  refundedItemId?: string | null;\n",
    "  refundAllocations?: TransactionRefundAllocation[];\n",
)
replace_once(
    "src/internal/transaction/schema.ts",
    '  const submittedRefundedItemValues = formData.getAll("itemRefundedItemId");\n',
    '  const submittedRefundAllocationValues = formData.getAll(\n'
    '    "itemRefundAllocations",\n'
    '  );\n',
)
replace_once(
    "src/internal/transaction/schema.ts",
    "    (submittedRefundedItemValues.length > 0 &&\n      categoryValues.length !== submittedRefundedItemValues.length)\n",
    "    (submittedRefundAllocationValues.length > 0 &&\n      categoryValues.length !== submittedRefundAllocationValues.length)\n",
)
replace_once(
    "src/internal/transaction/schema.ts",
    '''    const refundedItemIdText = String(
      submittedRefundedItemValues[index] ?? "",
    ).trim();
    const refundedItemIdResult = parseOptionalUuidText(
      refundedItemIdText,
      transactionErrorCodes.specialStatusInvalid,
    );
    if (!refundedItemIdResult.ok) return refundedItemIdResult;
    if (refundedItemIdResult.value && amountResult.value <= 0) {
      return invalid(transactionErrorCodes.refundLinkInvalid);
    }

    items.push({
''',
    '''    const refundAllocations = parseRefundAllocations(
      submittedRefundAllocationValues[index],
    );
    if (refundAllocations === null) {
      return invalid(transactionErrorCodes.refundLinkInvalid);
    }
    if (
      refundAllocations.length > 0 &&
      toMinorUnits(refundAllocations.reduce((sum, allocation) => sum + allocation.refundAmount, 0)) !==
        toMinorUnits(amountResult.value)
    ) {
      return invalid(transactionErrorCodes.refundLinkInvalid);
    }

    items.push({
''',
)
replace_once(
    "src/internal/transaction/schema.ts",
    '''      ...(refundedItemIdResult.value
        ? { refundedItemId: refundedItemIdResult.value }
        : {}),
''',
    '''      ...(refundAllocations.length > 0 ? { refundAllocations } : {}),
''',
)
replace_once(
    "src/internal/transaction/schema.ts",
    "function parseUuidArray(\n",
    '''function parseRefundAllocations(
  value: FormDataEntryValue | undefined,
): TransactionRefundAllocation[] | null {
  if (value === undefined || String(value).trim() === "") return [];

  try {
    const parsed: unknown = JSON.parse(String(value));
    if (!Array.isArray(parsed) || parsed.length > 100) return null;

    const allocations: TransactionRefundAllocation[] = [];
    const ids = new Set<string>();
    for (const allocation of parsed) {
      if (!allocation || typeof allocation !== "object") return null;
      const record = allocation as Record<string, unknown>;
      const refundedItemId = record.refundedItemId;
      const refundAmount = record.refundAmount;
      if (
        typeof refundedItemId !== "string" ||
        !z.string().uuid().safeParse(refundedItemId).success ||
        ids.has(refundedItemId) ||
        (typeof refundAmount !== "number" && typeof refundAmount !== "string")
      ) {
        return null;
      }
      const numericAmount = Number(refundAmount);
      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0 ||
        toMinorUnits(numericAmount) === null
      ) {
        return null;
      }
      ids.add(refundedItemId);
      allocations.push({ refundedItemId, refundAmount: numericAmount });
    }
    return allocations;
  } catch {
    return null;
  }
}

function toMinorUnits(value: number) {
  const units = value * 100;
  return Number.isSafeInteger(units) ? units : null;
}

function parseUuidArray(
''',
)

replace_once(
    "src/internal/transaction/repository/transactionRepository.ts",
    'import type { TransactionType } from "internal/transaction/entity/transactionType";\n',
    'import type { TransactionType } from "internal/transaction/entity/transactionType";\n'
    'import type { TransactionRefundAllocation } from "internal/transaction/util/refundAllocation";\n',
)
replace_once(
    "src/internal/transaction/repository/transactionRepository.ts",
    "  refundedItemId?: string | null;\n",
    "  refundAllocations?: TransactionRefundAllocation[];\n",
)
replace_once(
    "src/internal/transaction/repository/transactionRepository.ts",
    '  "refund_amount_exceeded",\n',
    '  "refund_amount_exceeded",\n  "refund_allocation_invalid",\n',
)
replace_once(
    "src/internal/transaction/repository/transactionRepository.ts",
    '''    if (rpcErrorCode === "refund_amount_exceeded") {
      throw new ConflictError(
        transactionErrorCodes.refundAmountExceeded,
        "退款金额超过该明细的剩余可退金额，请调整金额后重试。",
      );
    }
''',
    '''    if (rpcErrorCode === "refund_amount_exceeded") {
      throw new ConflictError(
        transactionErrorCodes.refundAmountExceeded,
        "退款金额超过所选明细的剩余可退金额，请重新选择。",
      );
    }

    if (rpcErrorCode === "refund_allocation_invalid") {
      throw new ValidationError(
        transactionErrorCodes.refundLinkInvalid,
        "退款分摊结果不正确，请重新选择退款明细。",
      );
    }
''',
)
replace_once(
    "src/internal/transaction/repository/transactionRepository.ts",
    '        "该收入明细已经关联过一笔退款，请刷新后重试。",\n',
    '        "同一退款收入不能重复关联同一支出明细，请刷新后重试。",\n',
)
replace_once(
    "src/internal/transaction/repository/transactionRepository.ts",
    "    refundedItemId: item.refundedItemId ?? null,\n",
    "    refundAllocations: item.refundAllocations ?? [],\n",
)

replace_all(
    "src/internal/transaction/service/transactionService.ts",
    "Boolean(item.refundedItemId)",
    "Boolean(item.refundAllocations?.length)",
    minimum=2,
)
replace_once(
    "src/internal/transaction/service/transactionService.ts",
    '''      if (hasReimbursementLinks && hasRefundLink) {
        throw new ValidationError(
          transactionErrorCodes.specialStatusInvalid,
          "同一条收入明细不能同时作为报销和退款。",
        );
      }
''',
    '''      if (hasReimbursementLinks && hasRefundLink) {
        throw new ValidationError(
          transactionErrorCodes.specialStatusInvalid,
          "同一条收入明细不能同时作为报销和退款。",
        );
      }
      if (hasRefundLink) {
        const allocations = item.refundAllocations ?? [];
        const targetIds = new Set(
          allocations.map((allocation) => allocation.refundedItemId),
        );
        const totalUnits = allocations.reduce(
          (sum, allocation) => sum + Math.round(allocation.refundAmount * 100),
          0,
        );
        if (
          targetIds.size !== allocations.length ||
          allocations.some(
            (allocation) =>
              allocation.refundAmount <= 0 ||
              !Number.isSafeInteger(allocation.refundAmount * 100),
          ) ||
          totalUnits !== Math.round(item.amount * 100)
        ) {
          throw new ValidationError(
            transactionErrorCodes.refundLinkInvalid,
            "退款分摊金额不正确，请重新选择退款明细。",
          );
        }
      }
''',
)

# ---------------------------------------------------------------------------
# 收入关联读取改为一对多
# ---------------------------------------------------------------------------
write(
    "src/internal/transaction/repository/transactionIncomeLinkRepository.ts",
    r'''import type { Logger } from "internal/shared/logging/logger";
import type { AuthenticatedSupabaseClient } from "internal/shared/supabase/authenticatedClient";
import { toRepositoryError } from "internal/shared/supabase/repositoryError";

export type TransactionIncomeLinkedItem = {
  accountId: string;
  amount: string;
  categoryId: string;
  id: string;
  refundedAmount: string;
  transactionAt: string;
  transactionRecordId: string;
};

export type TransactionIncomeRefundAllocation = {
  refundAmount: string;
  refundedItem: TransactionIncomeLinkedItem;
};

export type TransactionIncomeLinkData = {
  incomeItemId: string;
  refundAllocations: TransactionIncomeRefundAllocation[];
  reimbursementItems: TransactionIncomeLinkedItem[];
};

export interface TransactionIncomeLinkRepository {
  listByIncomeItemIds(
    ledgerId: string,
    incomeItemIds: string[],
  ): Promise<TransactionIncomeLinkData[]>;
}

type RefundLinkRow = {
  refund_amount: string;
  refund_income_item_id: string;
  refunded_item_id: string;
};

type LinkedItemRow = {
  account_id: string;
  amount: string;
  category_id: string | null;
  id: string;
  refunded_amount: string | null;
  settled_by_item_id: string | null;
  transaction_record_id: string;
};

type TransactionAtRow = {
  id: string;
  transaction_at: string;
};

export function createSupabaseTransactionIncomeLinkRepository(
  supabase: AuthenticatedSupabaseClient,
  logger: Logger,
): TransactionIncomeLinkRepository {
  function throwLoadError(
    operation: string,
    databaseCode: string | undefined,
    ledgerId: string,
  ): never {
    logger.error(`[transaction] ${operation}`, { databaseCode, ledgerId });
    throw toRepositoryError(
      "transaction_income_links_load_failed",
      "收入关联信息加载失败，请稍后重试。",
    );
  }

  return {
    async listByIncomeItemIds(ledgerId, incomeItemIds) {
      const uniqueIncomeItemIds = [...new Set(incomeItemIds)];
      if (uniqueIncomeItemIds.length === 0) return [];

      const [refundLinkResult, reimbursementResult] = await Promise.all([
        supabase
          .from("transaction_item_refund_link")
          .select("refund_income_item_id, refunded_item_id, refund_amount")
          .eq("ledger_id", ledgerId)
          .in("refund_income_item_id", uniqueIncomeItemIds),
        supabase
          .from("transaction_item_with_refund")
          .select(
            "id, transaction_record_id, account_id, category_id, amount, refunded_amount, settled_by_item_id",
          )
          .eq("ledger_id", ledgerId)
          .in("settled_by_item_id", uniqueIncomeItemIds),
      ]);

      if (refundLinkResult.error) {
        throwLoadError(
          "failed to load refund income links",
          refundLinkResult.error.code,
          ledgerId,
        );
      }
      if (reimbursementResult.error) {
        throwLoadError(
          "failed to load reimbursement income links",
          reimbursementResult.error.code,
          ledgerId,
        );
      }

      const refundLinks = (refundLinkResult.data ?? []) as RefundLinkRow[];
      const reimbursementItems = (reimbursementResult.data ?? []) as LinkedItemRow[];
      const refundedItemIds = [
        ...new Set(refundLinks.map((link) => link.refunded_item_id)),
      ];
      const refundedItemResult =
        refundedItemIds.length === 0
          ? { data: [] as LinkedItemRow[], error: null }
          : await supabase
              .from("transaction_item_with_refund")
              .select(
                "id, transaction_record_id, account_id, category_id, amount, refunded_amount, settled_by_item_id",
              )
              .eq("ledger_id", ledgerId)
              .in("id", refundedItemIds);

      if (refundedItemResult.error) {
        throwLoadError(
          "failed to load refunded items",
          refundedItemResult.error.code,
          ledgerId,
        );
      }

      const refundedItems = (refundedItemResult.data ?? []) as LinkedItemRow[];
      const allItems = [...reimbursementItems, ...refundedItems];
      const transactionRecordIds = [
        ...new Set(allItems.map((item) => item.transaction_record_id)),
      ];
      const recordResult =
        transactionRecordIds.length === 0
          ? { data: [] as TransactionAtRow[], error: null }
          : await supabase
              .from("transaction_record")
              .select("id, transaction_at")
              .eq("ledger_id", ledgerId)
              .eq("status", "active")
              .in("id", transactionRecordIds);

      if (recordResult.error) {
        throwLoadError(
          "failed to load linked transaction records",
          recordResult.error.code,
          ledgerId,
        );
      }

      const transactionAtByRecordId = new Map(
        ((recordResult.data ?? []) as TransactionAtRow[]).map((record) => [
          record.id,
          record.transaction_at,
        ]),
      );
      const linkedItemById = new Map(
        allItems.flatMap((item) => {
          const linkedItem = buildLinkedItem(item, transactionAtByRecordId);
          return linkedItem ? [[linkedItem.id, linkedItem] as const] : [];
        }),
      );
      const refundLinksByIncomeItemId = new Map<string, RefundLinkRow[]>();
      for (const link of refundLinks) {
        const current = refundLinksByIncomeItemId.get(link.refund_income_item_id) ?? [];
        current.push(link);
        refundLinksByIncomeItemId.set(link.refund_income_item_id, current);
      }
      const reimbursementItemsByIncomeItemId = new Map<
        string,
        TransactionIncomeLinkedItem[]
      >();

      for (const item of reimbursementItems) {
        if (!item.settled_by_item_id) continue;
        const linkedItem = linkedItemById.get(item.id);
        if (!linkedItem) continue;
        const current =
          reimbursementItemsByIncomeItemId.get(item.settled_by_item_id) ?? [];
        current.push(linkedItem);
        reimbursementItemsByIncomeItemId.set(item.settled_by_item_id, current);
      }

      return uniqueIncomeItemIds.map((incomeItemId) => ({
        incomeItemId,
        refundAllocations: (refundLinksByIncomeItemId.get(incomeItemId) ?? [])
          .flatMap((link) => {
            const refundedItem = linkedItemById.get(link.refunded_item_id);
            return refundedItem
              ? [{ refundAmount: link.refund_amount, refundedItem }]
              : [];
          })
          .sort((left, right) => left.refundedItem.id.localeCompare(right.refundedItem.id)),
        reimbursementItems:
          reimbursementItemsByIncomeItemId.get(incomeItemId) ?? [],
      }));
    },
  };
}

function buildLinkedItem(
  item: LinkedItemRow,
  transactionAtByRecordId: Map<string, string>,
): TransactionIncomeLinkedItem | null {
  const transactionAt = transactionAtByRecordId.get(item.transaction_record_id);
  if (!transactionAt || !item.category_id) return null;

  return {
    accountId: item.account_id,
    amount: item.amount,
    categoryId: item.category_id,
    id: item.id,
    refundedAmount: item.refunded_amount ?? "0",
    transactionAt,
    transactionRecordId: item.transaction_record_id,
  };
}
''',
)

# ---------------------------------------------------------------------------
# 编辑页读取模型
# ---------------------------------------------------------------------------
replace_once(
    "src/internal/transaction/service/read/transactionReadModels.ts",
    '''          refundCandidate?: {
            accountCurrency: string;
            accountId: string;
            amount: string;
            categoryName: string;
            id: string;
            parentCategoryName: string | null;
            refundedAmount: string;
            remainingRefundableAmount: string;
            transactionAt: string;
            transactionRecordId: string;
          } | null;
          refundedAmount?: string;
          refundedItemId?: string | null;
''',
    '''          refundCandidates?: {
            accountCurrency: string;
            accountId: string;
            amount: string;
            categoryName: string;
            id: string;
            parentCategoryName: string | null;
            refundedAmount: string;
            remainingRefundableAmount: string;
            transactionAt: string;
            transactionRecordId: string;
          }[];
          refundedAmount?: string;
''',
)

replace_once(
    "src/internal/transaction/service/read/transactionFormService.ts",
    '''        const refundCandidate = buildRefundCandidate(
          incomeLink,
          item,
          options.accountOptions,
          options.categoryOptions,
          currentLedger.baseCurrency,
        );
''',
    '''        const refundCandidates = buildRefundCandidates(
          incomeLink,
          options.accountOptions,
          options.categoryOptions,
          currentLedger.baseCurrency,
        );
''',
)
replace_once(
    "src/internal/transaction/service/read/transactionFormService.ts",
    '''          refundCandidate,
          refundedAmount: item.refunded_amount ?? "0",
          refundedItemId: refundCandidate?.id ?? null,
''',
    '''          refundCandidates,
          refundedAmount: item.refunded_amount ?? "0",
''',
)
replace_once(
    "src/internal/transaction/service/read/transactionFormService.ts",
    '''function buildRefundCandidate(
  incomeLink: TransactionIncomeLinkData | undefined,
  incomeItem: TransactionItemDbRow,
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
  fallbackCurrency: string,
) {
  const refundedItem = incomeLink?.refundedItem;
  if (!refundedItem) return null;

  const account = accounts.find(
    (option) => option.id === refundedItem.accountId,
  );
  const category = categories.find(
    (option) => option.id === refundedItem.categoryId,
  );
  const refundedAmount = Number(refundedItem.refundedAmount);
  const incomeAmount = Number(incomeItem.amount);
  const originalAmount = Number(refundedItem.amount);
  const remainingRefundableAmount = Math.max(
    0,
    originalAmount - refundedAmount + incomeAmount,
  );

  return {
    accountCurrency: account?.currency ?? fallbackCurrency,
    accountId: refundedItem.accountId,
    amount: refundedItem.amount,
    categoryName: category?.name ?? "未知分类",
    id: refundedItem.id,
    parentCategoryName: category?.parentName ?? null,
    refundedAmount: refundedItem.refundedAmount,
    remainingRefundableAmount: String(remainingRefundableAmount),
    transactionAt: refundedItem.transactionAt,
    transactionRecordId: refundedItem.transactionRecordId,
  };
}
''',
    '''function buildRefundCandidates(
  incomeLink: TransactionIncomeLinkData | undefined,
  accounts: TransactionAccountOption[],
  categories: TransactionCategoryOption[],
  fallbackCurrency: string,
) {
  return (incomeLink?.refundAllocations ?? []).map(
    ({ refundAmount, refundedItem }) => {
      const account = accounts.find(
        (option) => option.id === refundedItem.accountId,
      );
      const category = categories.find(
        (option) => option.id === refundedItem.categoryId,
      );
      const remainingRefundableAmount = Math.max(
        0,
        Number(refundedItem.amount) -
          Number(refundedItem.refundedAmount) +
          Number(refundAmount),
      );

      return {
        accountCurrency: account?.currency ?? fallbackCurrency,
        accountId: refundedItem.accountId,
        amount: refundedItem.amount,
        categoryName: category?.name ?? "未知分类",
        id: refundedItem.id,
        parentCategoryName: category?.parentName ?? null,
        refundedAmount: refundedItem.refundedAmount,
        remainingRefundableAmount: String(remainingRefundableAmount),
        transactionAt: refundedItem.transactionAt,
        transactionRecordId: refundedItem.transactionRecordId,
      };
    },
  );
}
''',
)

# ---------------------------------------------------------------------------
# 前端表单状态与隐藏字段
# ---------------------------------------------------------------------------
replace_all(
    "src/components/organisms/transactions/TransactionForm/TransactionForm.types.ts",
    "refundCandidate",
    "refundCandidates",
    minimum=2,
)
replace_all(
    "src/components/organisms/transactions/TransactionForm/TransactionForm.types.ts",
    "  refundedItemId?: string | null;\n",
    "",
    minimum=2,
)
replace_all(
    "src/components/organisms/transactions/TransactionForm/TransactionForm.types.ts",
    "TransactionRefundCandidate | null",
    "TransactionRefundCandidate[]",
    minimum=2,
)

path = "src/components/organisms/transactions/TransactionForm/useTransactionForm.ts"
replace_all(path, "pickerRefundCandidate", "pickerRefundCandidates", minimum=10)
replace_all(path, "setPickerRefundCandidate", "setPickerRefundCandidates", minimum=10)
replace_all(path, "refundCandidate", "refundCandidates", minimum=8)
replace_all(path, "useState<TransactionRefundCandidate | null>(null)", "useState<TransactionRefundCandidate[]>([])")
replace_all(path, "setPickerRefundCandidates(null)", "setPickerRefundCandidates([])", minimum=5)
replace_all(path, "refundedItemId: string | null", "refundCandidates: TransactionRefundCandidate[]", minimum=2)
replace_all(path, "          refundedItemId,\n", "", minimum=2)
replace_all(path, "          refundCandidates: pickerRefundCandidates,\n", "          refundCandidates,\n", minimum=2)
replace_all(path, "        pickerRefundCandidates?.id ?? null,\n", "        pickerRefundCandidates,\n", minimum=2)
replace_once(
    path,
    'import { transactionFormValidationMessages } from "utils/transactionMessages";\n',
    'import { transactionFormValidationMessages } from "utils/transactionMessages";\n'
    'import { allocateRefundAmount } from "internal/transaction";\n',
)
replace_once(
    path,
    '''  const hasValidItems =
    allDisplayItems.length > 0 &&
    allDisplayItems.every(
      (item) => item.categoryId.length > 0 && isValidMoneyText(item.amount),
    );
''',
    '''  const hasValidItems =
    allDisplayItems.length > 0 &&
    allDisplayItems.every(
      (item) =>
        item.categoryId.length > 0 &&
        isValidMoneyText(item.amount) &&
        ((item.refundCandidates?.length ?? 0) === 0 ||
          allocateRefundAmount(item.amount, item.refundCandidates ?? []) !== null),
    );
''',
)
replace_once(
    path,
    '''    if (!isValidMoneyText(pickerAmount)) {
      errors.amount = transactionFormValidationMessages.amountInvalid;
    }
''',
    '''    if (!isValidMoneyText(pickerAmount)) {
      errors.amount = transactionFormValidationMessages.amountInvalid;
    } else if (
      pickerRefundCandidates.length > 0 &&
      allocateRefundAmount(pickerAmount, pickerRefundCandidates) === null
    ) {
      errors.amount = "退款金额无法按所选明细有效分摊，请调整金额或选择。";
    }
''',
)
replace_once(
    path,
    '''        item.refundCandidates && item.refundCandidates.accountId !== accountId
          ? {
              ...item,
              businessStatus: getFormItemBusinessStatus(
                item.specialStatus,
                item.reimbursementItemIds ?? [],
                null,
              ),
              refundedItemId: null,
              refundCandidates: null,
            }
''',
    '''        item.refundCandidates?.some(
          (candidate) => candidate.accountId !== accountId,
        )
          ? {
              ...item,
              businessStatus: getFormItemBusinessStatus(
                item.specialStatus,
                item.reimbursementItemIds ?? [],
                [],
              ),
              refundCandidates: [],
            }
''',
)
replace_once(
    path,
    '''    if (
      pickerRefundCandidates &&
      pickerRefundCandidates.accountId !== accountId
    ) {
      setPickerRefundCandidates([]);
      setLinkNotice("账户已变更，请重新选择退款明细。");
    }
''',
    '''    if (
      pickerRefundCandidates.some((candidate) => candidate.accountId !== accountId)
    ) {
      setPickerRefundCandidates([]);
      setLinkNotice("账户已变更，请重新选择退款明细。");
    }
''',
)
replace_once(
    path,
    '''    setPickerRefundCandidates: (
      candidate: TransactionRefundCandidate | null,
    ) => {
      if (candidate && candidate.accountId !== selectedAccountId) {
        setPickerRefundCandidates([]);
        setLinkNotice("退款明细必须与收款账户一致，请重新选择。");
        return;
      }
      setPickerRefundCandidates(candidate);
      if (candidate) setPickerReimbursementItemIds([]);
      setLinkNotice(null);
    },
''',
    '''    setPickerRefundCandidates: (candidates: TransactionRefundCandidate[]) => {
      if (
        candidates.some((candidate) => candidate.accountId !== selectedAccountId)
      ) {
        setPickerRefundCandidates([]);
        setLinkNotice("退款明细必须与收款账户一致，请重新选择。");
        return;
      }
      setPickerRefundCandidates(candidates);
      if (candidates.length > 0) setPickerReimbursementItemIds([]);
      setLinkNotice(null);
    },
''',
)
replace_once(
    path,
    "      if (ids.length > 0) setPickerRefundCandidates(null);\n",
    "      if (ids.length > 0) setPickerRefundCandidates([]);\n",
)
replace_once(
    path,
    '''  refundCandidates: TransactionRefundCandidate | null,
): TransactionBusinessStatus | null {
  if (refundCandidates) return "refund";
''',
    '''  refundCandidates: TransactionRefundCandidate[],
): TransactionBusinessStatus | null {
  if (refundCandidates.length > 0) return "refund";
''',
)

replace_once(
    "src/components/organisms/transactions/TransactionItemsSection/TransactionItemsSection.tsx",
    'import type { TransactionType } from "types/transactions";\n',
    'import type { TransactionType } from "types/transactions";\n'
    'import { allocateRefundAmount } from "internal/transaction";\n',
)
replace_once(
    "src/components/organisms/transactions/TransactionItemsSection/TransactionItemsSection.tsx",
    '''                    <input
                      name="itemRefundedItemId"
                      type="hidden"
                      value={item.refundedItemId ?? ""}
                    />
''',
    '''                    <input
                      name="itemRefundAllocations"
                      type="hidden"
                      value={JSON.stringify(
                        allocateRefundAmount(
                          item.amount,
                          item.refundCandidates ?? [],
                        ) ?? [],
                      )}
                    />
''',
)

path = "src/components/organisms/transactions/TransactionForm/TransactionForm.tsx"
replace_all(path, "pickerRefundCandidate", "pickerRefundCandidates", minimum=3)
replace_all(path, "setPickerRefundCandidate", "setPickerRefundCandidates", minimum=2)
replace_once(path, "onRefundItemChange={setPickerRefundCandidates}", "onRefundItemsChange={setPickerRefundCandidates}")

path = "src/components/organisms/transactions/TransactionItemPickerDrawer/TransactionItemPickerDrawer.tsx"
replace_all(path, "pickerRefundCandidate", "pickerRefundCandidates", minimum=5)
replace_all(path, "onRefundItemChange", "onRefundItemsChange", minimum=4)
replace_all(path, "handleRefundChange", "handleRefundsChange", minimum=2)
replace_all(path, "TransactionRefundCandidate | null", "TransactionRefundCandidate[]", minimum=2)
replace_all(path, "= null,", "= [],", minimum=1)
replace_once(
    path,
    '''  function handleRefundsChange(item: TransactionRefundCandidate[]) {
    onRefundItemsChange(item);
    if (item) onReimbursementItemIdsChange([]);
  }
''',
    '''  function handleRefundsChange(items: TransactionRefundCandidate[]) {
    onRefundItemsChange(items);
    if (items.length > 0) onReimbursementItemIdsChange([]);
  }
''',
)
replace_all(path, "if (ids.length > 0) onRefundItemsChange(null);", "if (ids.length > 0) onRefundItemsChange([]);")
replace_once(path, "{pickerRefundCandidates ? null : (", "{pickerRefundCandidates.length > 0 ? null : (")
replace_once(path, "{pickerReimbursementItemIds.length > 0 ? null : (", "{pickerReimbursementItemIds.length > 0 ? null : (")
replace_once(path, "onChange={handleRefundsChange}", "onChange={handleRefundsChange}")
replace_once(path, "value={pickerRefundCandidates}", "refundAmount={pickerAmount}\n                value={pickerRefundCandidates}")

# ---------------------------------------------------------------------------
# 多选选择页及列表选择状态
# ---------------------------------------------------------------------------
write(
    "src/components/organisms/transactions/TransactionRefundLinkPicker/TransactionRefundLinkPicker.tsx",
    r'''import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { allocateRefundAmount } from "internal/transaction";
import { TransactionMonthList } from "../TransactionMonthList/TransactionMonthList";
import { TransactionSearchTemplate } from "templates/transactions/TransactionSearch";
import type {
  TransactionGroupPage,
  TransactionMonthPage,
  TransactionRefundCandidate,
  TransactionSearchPage,
  TransactionTimeGroupViewData,
} from "types/transactions";
import { getCurrencySymbol } from "utils/currency";
import { formatNumber } from "utils/transactions";

type TransactionRefundLinkPickerProps = {
  loadGroupItemsAction?: (
    groupKey: string,
    offset: number,
  ) => Promise<TransactionMonthPage>;
  loadMoreGroupsAction?: (offset: number) => Promise<TransactionGroupPage>;
  loadSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
  onChange: (items: TransactionRefundCandidate[]) => void;
  refundAmount: string;
  timeGroupView?: TransactionTimeGroupViewData;
  value: TransactionRefundCandidate[];
};

const emptySearchPage: TransactionSearchPage = {
  items: [],
  nextOffset: null,
  totalCount: 0,
};

export function TransactionRefundLinkPicker({
  loadGroupItemsAction,
  loadMoreGroupsAction,
  loadSearchPageAction,
  onChange,
  refundAmount,
  timeGroupView,
  value,
}: TransactionRefundLinkPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"browse" | "search">("browse");
  const [draftValue, setDraftValue] = useState<TransactionRefundCandidate[]>([]);
  const allocations = useMemo(
    () => allocateRefundAmount(refundAmount, value),
    [refundAmount, value],
  );
  const allocationByItemId = new Map(
    (allocations ?? []).map((allocation) => [
      allocation.refundedItemId,
      allocation.refundAmount,
    ]),
  );
  const selectedIds = draftValue.map((item) => item.id);

  const openPicker = () => {
    setDraftValue(value);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const toggle = (item: TransactionRefundCandidate) => {
    setDraftValue((current) =>
      current.some((candidate) => candidate.id === item.id)
        ? current.filter((candidate) => candidate.id !== item.id)
        : [...current, item],
    );
  };
  const confirm = () => {
    if (
      draftValue.length > 0 &&
      allocateRefundAmount(refundAmount, draftValue) === null
    ) {
      return;
    }
    onChange(draftValue);
    close();
  };

  return (
    <Stack component="section" spacing={0.75} sx={containerSx}>
      <Typography sx={{ fontWeight: 900 }}>退款关联</Typography>
      {value.length > 0 ? (
        <Stack spacing={0.75}>
          {value.map((item) => (
            <Stack direction="row" key={item.id} sx={selectedSx}>
              <Stack>
                <Typography sx={{ fontWeight: 800 }} variant="body2">
                  {item.categoryName} · {getCurrencySymbol(item.accountCurrency)}
                  {formatNumber(item.amount)}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  本次分摊 {getCurrencySymbol(item.accountCurrency)}
                  {formatNumber(String(allocationByItemId.get(item.id) ?? 0))} · 剩余可退{" "}
                  {getCurrencySymbol(item.accountCurrency)}
                  {formatNumber(item.remainingRefundableAmount)}
                </Typography>
              </Stack>
            </Stack>
          ))}
          <Button onClick={() => onChange([])}>取消全部关联</Button>
          {allocations === null ? (
            <Typography color="error" variant="caption">
              当前金额无法向每条所选明细分摊至少 0.01，请调整金额或选择。
            </Typography>
          ) : null}
        </Stack>
      ) : (
        <Typography color="text.secondary" variant="caption">
          可选择多条历史支出，退款金额将按各明细剩余可退金额比例自动分摊。
        </Typography>
      )}
      <Button onClick={openPicker} variant="outlined">
        {value.length > 0 ? `已选择 ${value.length} 条，重新选择` : "选择退款明细"}
      </Button>

      <Dialog fullScreen onClose={close} open={open}>
        <Stack direction="row" sx={headerSx}>
          <IconButton aria-label="关闭退款关联选择器" onClick={close}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography component="h2" sx={{ flex: 1, fontWeight: 900 }}>
            选择退款明细
          </Typography>
          <Button
            disabled={
              draftValue.length > 0 &&
              allocateRefundAmount(refundAmount, draftValue) === null
            }
            onClick={confirm}
          >
            完成{draftValue.length > 0 ? `（${draftValue.length}）` : ""}
          </Button>
        </Stack>
        <Tabs
          onChange={(_, next) => setTab(next)}
          value={tab}
          variant="fullWidth"
        >
          <Tab label="按月浏览" value="browse" />
          <Tab label="搜索" value="search" />
        </Tabs>
        <DialogContent>
          {tab === "browse" ? (
            timeGroupView ? (
              <TransactionMonthList
                loadGroupItemsAction={loadGroupItemsAction}
                loadMoreGroupsAction={loadMoreGroupsAction}
                onSelectRefundItem={toggle}
                refundSelectionMode
                selectedRefundItemIds={selectedIds}
                timeGroupView={timeGroupView}
              />
            ) : (
              <Typography color="text.secondary">
                支出明细加载失败，请稍后重试。
              </Typography>
            )
          ) : (
            <TransactionSearchTemplate
              errorMessage={null}
              initialPage={emptySearchPage}
              initialQuery=""
              loadSearchPageAction={loadSearchPageAction}
              onClose={close}
              onSelectRefundItem={toggle}
              refundSelectionMode
              selectedRefundItemIds={selectedIds}
            />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

const containerSx = { borderTop: 1, borderColor: "divider", mt: 1.5, pt: 1.25 };
const selectedSx = { alignItems: "center", justifyContent: "space-between" };
const headerSx = { alignItems: "center", gap: 1, minHeight: 56, px: 1 };
''',
)

path = "src/components/organisms/transactions/TransactionGroupList/TransactionGroupList.tsx"
replace_once(path, 'import ButtonBase from "@mui/material/ButtonBase";\n', 'import ButtonBase from "@mui/material/ButtonBase";\nimport Checkbox from "@mui/material/Checkbox";\n')
replace_once(path, "  refundSelectionMode?: boolean;\n", "  refundSelectionMode?: boolean;\n  selectedRefundItemIds?: string[];\n")
replace_once(path, "  refundSelectionMode = false,\n", "  refundSelectionMode = false,\n  selectedRefundItemIds = [],\n")
replace_once(path, "                onSelect={onSelectRefundItem}\n", "                onSelect={onSelectRefundItem}\n                selectedIds={selectedRefundItemIds}\n")
replace_once(
    path,
    '''  onSelect,
}: {
  items: TransactionListItem[];
  onSelect: (item: TransactionRefundCandidate) => void;
}) {
''',
    '''  onSelect,
  selectedIds = [],
}: {
  items: TransactionListItem[];
  onSelect: (item: TransactionRefundCandidate) => void;
  selectedIds?: string[];
}) {
''',
)
replace_once(
    path,
    '''        const disabled = Number(candidate.remainingRefundableAmount) <= 0;
        const currencySymbol = getCurrencySymbol(candidate.accountCurrency);
''',
    '''        const disabled = Number(candidate.remainingRefundableAmount) <= 0;
        const selected = selectedIds.includes(candidate.id);
        const currencySymbol = getCurrencySymbol(candidate.accountCurrency);
''',
)
replace_once(path, "            disabled={disabled}\n", "            aria-pressed={selected}\n            disabled={disabled}\n")
replace_once(
    path,
    '''            <Stack sx={{ minWidth: 0, textAlign: "left" }}>
''',
    '''            <Checkbox checked={selected} tabIndex={-1} />
            <Stack sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
''',
)
replace_once(path, "  justifyContent: \"space-between\",\n", "  gap: 0.75,\n  justifyContent: \"space-between\",\n")

path = "src/components/organisms/transactions/TransactionMonthList/TransactionMonthList.tsx"
replace_once(path, "  refundSelectionMode?: boolean;\n", "  refundSelectionMode?: boolean;\n  selectedRefundItemIds?: string[];\n")
replace_once(path, "  refundSelectionMode = false,\n", "  refundSelectionMode = false,\n  selectedRefundItemIds = [],\n")
replace_once(path, "                        refundSelectionMode={refundSelectionMode}\n", "                        refundSelectionMode={refundSelectionMode}\n                        selectedRefundItemIds={selectedRefundItemIds}\n")

path = "src/components/templates/transactions/TransactionSearch.tsx"
replace_once(path, "  refundSelectionMode?: boolean;\n", "  refundSelectionMode?: boolean;\n  selectedRefundItemIds?: string[];\n")
replace_once(path, "  refundSelectionMode = false,\n", "  refundSelectionMode = false,\n  selectedRefundItemIds = [],\n")
replace_once(path, "                onSelect={onSelectRefundItem}\n", "                onSelect={onSelectRefundItem}\n                selectedIds={selectedRefundItemIds}\n")

# ---------------------------------------------------------------------------
# 数据库多对多分摊
# ---------------------------------------------------------------------------
write(
    "supabase/migrations/20260805010000_support_refund_multi_item_allocation.sql",
    r'''-- 将退款收入从单目标关联扩展为多目标分摊。
-- 分摊以 0.01 为最小单位，采用最大余数法，并以目标明细 ID 作为稳定尾差顺序。

alter table public.transaction_item_refund_link
    drop constraint if exists transaction_item_refund_link_income_unique;

alter table public.transaction_item_refund_link
    add constraint transaction_item_refund_link_income_target_unique
    unique (refund_income_item_id, refunded_item_id);

create or replace function public.apply_transaction_item_links(
    p_ledger_id uuid,
    p_income_item_id uuid,
    p_item jsonb,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_income_amount numeric(14,2);
    v_income_account_id uuid;
    v_income_category_type text;
    v_income_currency text;
    v_reimbursement_ids uuid[];
    v_reimbursement_amount numeric(14,2);
    v_reimbursement_currency text;
    v_reimbursement_currency_count integer;
    v_requested_count integer;
    v_updated_count integer;
    v_special_status_enabled boolean;
    v_refund_allocations jsonb := coalesce(p_item -> 'refundAllocations', '[]'::jsonb);
    v_refund_count integer := 0;
    v_refund_distinct_count integer := 0;
    v_refund_total numeric(14,2) := 0;
    v_refund_target_ids uuid[] := array[]::uuid[];
    v_locked_count integer := 0;
    v_invalid_count integer := 0;
begin
    v_reimbursement_ids := array(
        select value::uuid
        from jsonb_array_elements_text(
            coalesce(p_item -> 'reimbursementItemIds', '[]'::jsonb)
        ) as value
    );
    v_requested_count := coalesce(array_length(v_reimbursement_ids, 1), 0);

    if jsonb_typeof(v_refund_allocations) is distinct from 'array'
       or jsonb_array_length(v_refund_allocations) > 100 then
        raise exception 'refund_allocation_invalid'
            using errcode = '22023', detail = 'refund_allocation_invalid';
    end if;

    begin
        select
            count(*)::integer,
            count(distinct (allocation ->> 'refundedItemId')::uuid)::integer,
            coalesce(sum((allocation ->> 'refundAmount')::numeric), 0),
            coalesce(
                array_agg(
                    (allocation ->> 'refundedItemId')::uuid
                    order by (allocation ->> 'refundedItemId')::uuid
                ),
                array[]::uuid[]
            )
        into
            v_refund_count,
            v_refund_distinct_count,
            v_refund_total,
            v_refund_target_ids
        from jsonb_array_elements(v_refund_allocations) allocation;
    exception
        when invalid_text_representation or numeric_value_out_of_range then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
    end;

    if exists (
        select 1
        from jsonb_array_elements(v_refund_allocations) allocation
        where jsonb_typeof(allocation) is distinct from 'object'
           or nullif(allocation ->> 'refundedItemId', '') is null
           or nullif(allocation ->> 'refundAmount', '') is null
           or (allocation ->> 'refundAmount')::numeric <= 0
           or (allocation ->> 'refundAmount')::numeric
                <> round((allocation ->> 'refundAmount')::numeric, 2)
    ) or v_refund_count <> v_refund_distinct_count then
        raise exception 'refund_allocation_invalid'
            using errcode = '22023', detail = 'refund_allocation_invalid';
    end if;

    if v_requested_count = 0 and v_refund_count = 0 then
        return;
    end if;

    select l.transaction_item_special_status_enabled
    into v_special_status_enabled
    from public.ledger l
    where l.id = p_ledger_id
    for update;

    if v_special_status_enabled is distinct from true then
        raise exception 'special_status_invalid'
            using errcode = '22023', detail = 'special_status_invalid';
    end if;

    select ti.amount, ti.account_id, c.type, a.currency
    into v_income_amount, v_income_account_id, v_income_category_type, v_income_currency
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
     and tr.status = 'active'
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
    join public.account a
      on a.id = ti.account_id
     and a.ledger_id = ti.ledger_id
    where ti.id = p_income_item_id
      and ti.ledger_id = p_ledger_id;

    if v_income_category_type is distinct from 'income' then
        raise exception 'income_link_category_invalid'
            using errcode = '22023', detail = 'income_link_category_invalid';
    end if;

    if v_requested_count > 0 and v_refund_count > 0 then
        raise exception 'income_link_conflict'
            using errcode = '22023', detail = 'income_link_conflict';
    end if;

    if v_requested_count > 0 then
        with locked_items as (
            select ti.id, ti.amount, a.currency
            from public.transaction_item ti
            join public.transaction_record tr
              on tr.id = ti.transaction_record_id
             and tr.ledger_id = ti.ledger_id
             and tr.status = 'active'
            join public.account a
              on a.id = ti.account_id
             and a.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id
              and ti.id = any(v_reimbursement_ids)
              and ti.special_status = 'pending_reimbursement'
              and ti.settled_by_item_id is null
              and not exists (
                  select 1
                  from public.transaction_item_refund_link link
                  join public.transaction_item refund_income
                    on refund_income.id = link.refund_income_item_id
                   and refund_income.ledger_id = link.ledger_id
                  join public.transaction_record refund_record
                    on refund_record.id = refund_income.transaction_record_id
                   and refund_record.ledger_id = refund_income.ledger_id
                  where link.ledger_id = p_ledger_id
                    and link.refunded_item_id = ti.id
                    and refund_record.status = 'active'
              )
            for update of ti, tr, a
        )
        select
            count(*)::integer,
            coalesce(sum(amount), 0),
            min(currency),
            count(distinct currency)::integer
        into
            v_updated_count,
            v_reimbursement_amount,
            v_reimbursement_currency,
            v_reimbursement_currency_count
        from locked_items;

        if v_updated_count <> v_requested_count then
            raise exception 'reimbursement_item_invalid'
                using errcode = 'P0001', detail = 'reimbursement_item_invalid';
        end if;

        if v_reimbursement_currency_count <> 1
           or v_income_currency is distinct from v_reimbursement_currency then
            raise exception 'reimbursement_currency_mismatch'
                using errcode = '22023', detail = 'reimbursement_currency_mismatch';
        end if;

        if v_income_amount is distinct from v_reimbursement_amount then
            raise exception 'reimbursement_amount_mismatch'
                using errcode = '22023', detail = 'reimbursement_amount_mismatch';
        end if;

        perform set_config('kuranote.reimbursement_link_flow', 'on', true);

        update public.transaction_item ti
        set special_status = 'reimbursed',
            settled_by_item_id = p_income_item_id,
            updated_by = p_user_id,
            updated_at = now()
        where ti.ledger_id = p_ledger_id
          and ti.id = any(v_reimbursement_ids)
          and ti.special_status = 'pending_reimbursement'
          and ti.settled_by_item_id is null;
    end if;

    if v_refund_count > 0 then
        if v_refund_total is distinct from v_income_amount then
            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

        perform 1
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
         and tr.status = 'active'
        where ti.ledger_id = p_ledger_id
          and ti.id = any(v_refund_target_ids)
        order by ti.id
        for update of ti, tr;

        get diagnostics v_locked_count = row_count;
        if v_locked_count <> v_refund_count then
            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        if exists (
            select 1
            from public.transaction_item ti
            join public.category c
              on c.id = ti.category_id
             and c.ledger_id = ti.ledger_id
            join public.account a
              on a.id = ti.account_id
             and a.ledger_id = ti.ledger_id
            where ti.ledger_id = p_ledger_id
              and ti.id = any(v_refund_target_ids)
              and (
                  c.type is distinct from 'expense'
                  or ti.special_status is not null
                  or a.currency is distinct from v_income_currency
                  or ti.account_id is distinct from v_income_account_id
              )
        ) then
            if exists (
                select 1
                from public.transaction_item ti
                join public.account a
                  on a.id = ti.account_id
                 and a.ledger_id = ti.ledger_id
                where ti.ledger_id = p_ledger_id
                  and ti.id = any(v_refund_target_ids)
                  and a.currency is distinct from v_income_currency
            ) then
                raise exception 'refund_currency_mismatch'
                    using errcode = '22023', detail = 'refund_currency_mismatch';
            end if;

            if exists (
                select 1
                from public.transaction_item ti
                where ti.ledger_id = p_ledger_id
                  and ti.id = any(v_refund_target_ids)
                  and ti.account_id is distinct from v_income_account_id
            ) then
                raise exception 'refund_account_mismatch'
                    using errcode = '22023', detail = 'refund_account_mismatch';
            end if;

            if exists (
                select 1
                from public.transaction_item ti
                where ti.ledger_id = p_ledger_id
                  and ti.id = any(v_refund_target_ids)
                  and ti.special_status is not null
            ) then
                raise exception 'refunded_item_special_status_conflict'
                    using errcode = '22023', detail = 'refunded_item_special_status_conflict';
            end if;

            raise exception 'refunded_item_invalid'
                using errcode = '22023', detail = 'refunded_item_invalid';
        end if;

        with requested as (
            select
                (allocation ->> 'refundedItemId')::uuid as refunded_item_id,
                round((allocation ->> 'refundAmount')::numeric * 100)::bigint
                    as requested_units
            from jsonb_array_elements(v_refund_allocations) allocation
        ), existing_refunds as (
            select
                link.refunded_item_id,
                coalesce(sum(link.refund_amount), 0) as refunded_amount
            from public.transaction_item_refund_link link
            join public.transaction_item refund_income
              on refund_income.id = link.refund_income_item_id
             and refund_income.ledger_id = link.ledger_id
            join public.transaction_record refund_record
              on refund_record.id = refund_income.transaction_record_id
             and refund_record.ledger_id = refund_income.ledger_id
            where link.ledger_id = p_ledger_id
              and link.refunded_item_id = any(v_refund_target_ids)
              and link.refund_income_item_id <> p_income_item_id
              and refund_record.status = 'active'
            group by link.refunded_item_id
        ), targets as (
            select
                requested.refunded_item_id,
                requested.requested_units,
                round(
                    (ti.amount - coalesce(existing_refunds.refunded_amount, 0)) * 100
                )::bigint as remaining_units
            from requested
            join public.transaction_item ti
              on ti.id = requested.refunded_item_id
             and ti.ledger_id = p_ledger_id
            left join existing_refunds
              on existing_refunds.refunded_item_id = requested.refunded_item_id
        ), allocation_base as (
            select
                targets.*,
                sum(remaining_units) over () as total_remaining_units,
                floor(
                    round(v_income_amount * 100)::numeric * remaining_units
                    / nullif(sum(remaining_units) over (), 0)
                )::bigint as base_units,
                mod(
                    round(v_income_amount * 100)::bigint * remaining_units,
                    nullif(sum(remaining_units) over (), 0)
                ) as remainder_units
            from targets
        ), ranked as (
            select
                allocation_base.*,
                row_number() over (
                    order by remainder_units desc, refunded_item_id
                ) as remainder_rank,
                round(v_income_amount * 100)::bigint
                    - sum(base_units) over () as tail_units
            from allocation_base
        ), expected as (
            select
                *,
                base_units + case when remainder_rank <= tail_units then 1 else 0 end
                    as expected_units
            from ranked
        )
        select count(*)::integer
        into v_invalid_count
        from expected
        where total_remaining_units < round(v_income_amount * 100)::bigint
           or expected_units <= 0
           or expected_units > remaining_units
           or requested_units <> expected_units;

        if v_invalid_count > 0 then
            if exists (
                with existing_refunds as (
                    select
                        link.refunded_item_id,
                        coalesce(sum(link.refund_amount), 0) as refunded_amount
                    from public.transaction_item_refund_link link
                    join public.transaction_item refund_income
                      on refund_income.id = link.refund_income_item_id
                     and refund_income.ledger_id = link.ledger_id
                    join public.transaction_record refund_record
                      on refund_record.id = refund_income.transaction_record_id
                     and refund_record.ledger_id = refund_income.ledger_id
                    where link.ledger_id = p_ledger_id
                      and link.refunded_item_id = any(v_refund_target_ids)
                      and link.refund_income_item_id <> p_income_item_id
                      and refund_record.status = 'active'
                    group by link.refunded_item_id
                )
                select 1
                from public.transaction_item ti
                left join existing_refunds
                  on existing_refunds.refunded_item_id = ti.id
                where ti.ledger_id = p_ledger_id
                  and ti.id = any(v_refund_target_ids)
                having sum(
                    ti.amount - coalesce(existing_refunds.refunded_amount, 0)
                ) < v_income_amount
            ) then
                raise exception 'refund_amount_exceeded'
                    using errcode = '22023', detail = 'refund_amount_exceeded';
            end if;

            raise exception 'refund_allocation_invalid'
                using errcode = '22023', detail = 'refund_allocation_invalid';
        end if;

        insert into public.transaction_item_refund_link (
            ledger_id,
            refunded_item_id,
            refund_income_item_id,
            refund_amount,
            created_by
        )
        select
            p_ledger_id,
            (allocation ->> 'refundedItemId')::uuid,
            p_income_item_id,
            (allocation ->> 'refundAmount')::numeric(14,2),
            p_user_id
        from jsonb_array_elements(v_refund_allocations) allocation
        order by (allocation ->> 'refundedItemId')::uuid;
    end if;
end;
$$;

revoke all on function public.apply_transaction_item_links(uuid, uuid, jsonb, uuid)
from public, anon, authenticated;
''',
)

# ---------------------------------------------------------------------------
# 单元测试的现有夹具 API 迁移（详细行为测试随后由新测试补齐）
# ---------------------------------------------------------------------------
for test_path in [
    "src/internal/transaction/schema.test.ts",
    "src/internal/transaction/service/transactionService.test.ts",
    "src/internal/transaction/repository/transactionRepository.test.ts",
    "src/internal/transaction/service/read/transactionFormService.test.ts",
    "src/components/organisms/transactions/TransactionForm/useTransactionForm.test.ts",
]:
    if (ROOT / test_path).exists():
        content = read(test_path)
        content = content.replace(
            "refundedItemId:",
            "refundAllocations: [{ refundedItemId:",
        )
        # 仅对简单对象夹具做迁移；复杂断言由测试运行结果进一步修正。
        write(test_path, content)

print("Issue #572 source transformations completed")
