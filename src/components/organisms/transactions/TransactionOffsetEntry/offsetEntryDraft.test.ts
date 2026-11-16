import { describe, expect, it } from "vitest";
import {
  offsetEntry,
  offsetItemsOptions,
} from "test/mocks/transactionOffsetEntry";
import { buildOffsetEntryDraft } from "./offsetEntryDraft";

describe("buildOffsetEntryDraft", () => {
  it.each(["refund", "reimbursement"] as const)(
    "单条未结清的 %s 直接生成剩余金额明细",
    (kind) => {
      const candidate = {
        ...offsetEntry.candidates[0],
        amount: "100",
        remainingRefundableAmount: "35",
      };
      const draft = buildOffsetEntryDraft(
        { ...offsetEntry, kind, candidates: [candidate] },
        offsetItemsOptions.categoryOptions,
      );
      expect(draft.items).toEqual([
        {
          categoryId: `system-${kind}`,
          amount: "35",
          [kind === "refund" ? "refundCandidate" : "reimbursementCandidate"]:
            candidate,
        },
      ]);
      expect(draft.merchantId).toBe("seven");
      expect(draft.payments[0].accountId).toBe("paypay");
    },
  );
  it("已归档原账户无有效推荐时保持账户为空，仍保留待核销明细", () => {
    const draft = buildOffsetEntryDraft(
      {
        ...offsetEntry,
        accountId: "",
        candidates: [offsetEntry.candidates[0]],
      },
      offsetItemsOptions.categoryOptions,
    );
    expect(draft.payments[0].accountId).toBe("");
    expect(draft.items[0]).toMatchObject({
      refundCandidate: { id: offsetEntry.candidates[0].id },
    });
  });
  it("多条未结清时小票保持为空，取消抽屉没有要撤销的明细", () => {
    expect(
      buildOffsetEntryDraft(offsetEntry, offsetItemsOptions.categoryOptions)
        .items,
    ).toEqual([]);
  });
  it("排除已结清后只剩一条时仍直接生成，商家可暂缺", () => {
    const draft = buildOffsetEntryDraft(
      {
        ...offsetEntry,
        merchantId: null,
        candidates: [
          offsetEntry.candidates[0],
          { ...offsetEntry.candidates[1], remainingRefundableAmount: "0" },
        ],
      },
      offsetItemsOptions.categoryOptions,
    );
    expect(draft.items).toHaveLength(1);
    expect(draft.merchantId).toBe("");
  });
});
