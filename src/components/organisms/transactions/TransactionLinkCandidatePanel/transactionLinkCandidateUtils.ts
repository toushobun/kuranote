import type { TransactionRefundCandidate } from "types/transactions";
import {
  isLinkCandidatePartiallySettled,
  isLinkCandidateSettled,
} from "internal/transaction";
import { transactionLinkCandidateMessages as m } from "config/transactionStepFlowMessages";
import { formatTransactionMonthDay } from "utils/transactions";

export function matchesLinkCandidateScope(
  candidate: TransactionRefundCandidate,
  currency: string | undefined,
  query: string,
) {
  if (currency && candidate.accountCurrency !== currency) return false;
  const term = query.trim().toLocaleLowerCase();
  if (!term) return true;
  const matchesText = [
    candidate.categoryName,
    candidate.parentCategoryName,
    candidate.note,
    candidate.merchantName,
    candidate.accountName,
    candidate.amount,
    candidate.transactionAt,
  ].some((value) => value?.toLocaleLowerCase().includes(term));
  if (matchesText) return true;
  // 与候选 RPC 一致：金额搜索可包含千分位、货币符号和空白。
  const amountTerm = term.replace(/[\s,，¥￥円]/g, "");
  return /[0-9]/.test(amountTerm) && candidate.amount.includes(amountTerm);
}

export type LinkCandidateGroupKey =
  | "locked"
  | "source"
  | "history"
  | "sameMerchant"
  | "other"
  | "partial";

type LinkCandidateOrderOptions = {
  kind: "refund" | "reimbursement";
  merchantId?: string;
  historyMerchantIds?: readonly string[];
  historyMerchantNames?: readonly string[];
  lockedAmounts?: ReadonlyMap<string, string>;
  sourceItemIds?: readonly string[];
  isActuallyPartiallySettled?: (
    candidate: TransactionRefundCandidate,
  ) => boolean;
};

export function getLinkCandidateRank(
  candidate: TransactionRefundCandidate,
  options: LinkCandidateOrderOptions,
): number {
  if (options.lockedAmounts?.has(candidate.id)) return 0;
  if (options.sourceItemIds?.includes(candidate.id)) return 1;
  if (
    options.isActuallyPartiallySettled?.(candidate) ??
    isLinkCandidatePartiallySettled(candidate)
  )
    return 5;
  if (
    options.kind === "refund" &&
    options.merchantId &&
    candidate.merchantId === options.merchantId
  )
    return 2;
  if (
    options.merchantId &&
    options.historyMerchantIds?.includes(candidate.merchantId ?? "")
  )
    return options.kind === "refund" ? 3 : 2;
  return options.kind === "refund" ? 4 : 3;
}

export function getLinkCandidateGroupKey(
  candidate: TransactionRefundCandidate,
  options: LinkCandidateOrderOptions,
): LinkCandidateGroupKey {
  const rank = getLinkCandidateRank(candidate, options);
  if (rank === 0) return "locked";
  if (rank === 1) return "source";
  if (rank === 5) return "partial";
  if (options.kind === "refund" && rank === 2) return "sameMerchant";
  if (
    (options.kind === "refund" && rank === 3) ||
    (options.kind === "reimbursement" && rank === 2)
  )
    return "history";
  return "other";
}

export function sortLinkCandidates(
  candidates: readonly TransactionRefundCandidate[],
  options: LinkCandidateOrderOptions & { settled: boolean },
) {
  const sourceOrder = new Map(
    options.sourceItemIds?.map((id, index) => [id, index]),
  );
  const rank = (candidate: TransactionRefundCandidate) =>
    options.settled
      ? options.kind === "refund" &&
        options.merchantId &&
        candidate.merchantId === options.merchantId
        ? 1
        : 2
      : getLinkCandidateRank(candidate, options);
  return [...candidates].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (!options.settled && rank(a) === 1
        ? sourceOrder.get(a.id)! - sourceOrder.get(b.id)!
        : 0) ||
      new Date(b.transactionAt).getTime() - new Date(a.transactionAt).getTime(),
  );
}

export type LinkCandidateGroup = {
  key: LinkCandidateGroupKey;
  title: string;
  hint?: string;
  candidates: TransactionRefundCandidate[];
  count: number;
};

/** 只决定分组结构与文案，不执行分页；计数由调用方校正数据库状态后传入。 */
export function groupLinkCandidates(
  candidates: readonly TransactionRefundCandidate[],
  options: LinkCandidateOrderOptions & {
    merchantName?: string;
    sourceCandidate?: TransactionRefundCandidate;
    counts?: Partial<Record<LinkCandidateGroupKey, number>>;
  },
): LinkCandidateGroup[] {
  const buckets: Record<LinkCandidateGroupKey, TransactionRefundCandidate[]> = {
    locked: [],
    source: [],
    history: [],
    sameMerchant: [],
    other: [],
    partial: [],
  };
  for (const candidate of sortLinkCandidates(candidates, {
    ...options,
    settled: false,
  })) {
    buckets[getLinkCandidateGroupKey(candidate, options)].push(candidate);
  }
  const name = options.merchantName ?? m.unassignedMerchant;
  const titles: Record<LinkCandidateGroupKey, string> = {
    locked: m.lockedGroup,
    source: m.sourceGroup,
    history: m.historyGroup(options.kind),
    sameMerchant: m.sameMerchantGroup(name),
    other: m.otherGroup(options.kind),
    partial: m.partialGroup,
  };
  const source = options.sourceCandidate;
  const hints: Partial<Record<LinkCandidateGroupKey, string>> = {
    ...(source
      ? {
          source: [
            source.merchantName,
            formatTransactionMonthDay(source.transactionAt),
          ]
            .filter(Boolean)
            .join(" · "),
        }
      : {}),
    history: [
      ...new Set([
        ...(options.historyMerchantNames ?? []),
        ...buckets.history.map(
          (item) => item.merchantName ?? m.unassignedMerchant,
        ),
      ]),
    ].join("、"),
  };
  const orderedKeys: LinkCandidateGroupKey[] = [
    "locked",
    "source",
    ...(options.kind === "refund" ? (["sameMerchant"] as const) : []),
    "history",
    "other",
    "partial",
  ];
  return orderedKeys.flatMap((key) => {
    const items = buckets[key];
    const count = Math.max(options.counts?.[key] ?? items.length, items.length);
    return count > 0
      ? [
          {
            key,
            title: titles[key],
            hint: hints[key],
            candidates: items,
            count,
          },
        ]
      : [];
  });
}

/** 将未保存草稿、入口来源及编辑置顶从数据库层级计数中去重。 */
export function reconcileLinkCandidateGroupCounts(
  databaseCounts:
    | { history: number; sameMerchant: number; other: number; partial: number }
    | undefined,
  options: LinkCandidateOrderOptions & {
    affectedCandidates: readonly TransactionRefundCandidate[];
    initialSelection?: TransactionRefundCandidate | null;
    isActuallySettled: (candidate: TransactionRefundCandidate) => boolean;
  },
): Partial<Record<LinkCandidateGroupKey, number>> | undefined {
  if (!databaseCounts) return undefined;
  const counts = { ...databaseCounts };
  const affected = new Map(
    options.affectedCandidates.map((candidate) => [candidate.id, candidate]),
  );
  if (options.initialSelection)
    affected.set(options.initialSelection.id, options.initialSelection);
  for (const candidate of affected.values()) {
    const groupOptions = {
      kind: options.kind,
      merchantId: options.merchantId,
      historyMerchantIds: options.historyMerchantIds,
    };
    const original = isLinkCandidateSettled(candidate)
      ? null
      : getLinkCandidateGroupKey(candidate, groupOptions);
    if (original && original !== "locked" && original !== "source")
      counts[original] -= 1;

    const movedToOwnGroup =
      candidate.id === options.initialSelection?.id ||
      options.lockedAmounts?.has(candidate.id) ||
      options.sourceItemIds?.includes(candidate.id);
    const actual =
      movedToOwnGroup || options.isActuallySettled(candidate)
        ? null
        : getLinkCandidateGroupKey(candidate, {
            ...groupOptions,
            isActuallyPartiallySettled: options.isActuallyPartiallySettled,
          });
    if (actual && actual !== "locked" && actual !== "source")
      counts[actual] += 1;
  }
  return {
    history: Math.max(0, counts.history),
    sameMerchant: Math.max(0, counts.sameMerchant),
    other: Math.max(0, counts.other),
    partial: Math.max(0, counts.partial),
  };
}
