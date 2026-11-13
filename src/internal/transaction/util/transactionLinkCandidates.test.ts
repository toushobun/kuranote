import { describe, expect, it } from "vitest";
import { createTransactionListItem } from "test/mocks/transactions";
import {
  adjustLinkCandidate,
  getLinkCandidateDefaultAmount,
  isLinkCandidateSettled,
  toTransactionLinkCandidates,
} from "./transactionLinkCandidates";

describe("transactionLinkCandidates", () => {
  const record = createTransactionListItem({
    categoryItems: [
      {
        id: "expense",
        categoryName: "午餐",
        categoryType: "expense",
        parentCategoryName: "餐饮",
        amount: "100",
        remainingRefundableAmount: "-20",
        refundedAmount: "50",
        businessStatus: {
          incomeLinkRole: null,
          settlementStatus: "reimbursementSurplus",
          offsetComposition: { refundAmount: "50", reimbursementAmount: "70" },
        },
      },
      {
        id: "income",
        categoryName: "收入",
        categoryType: "income",
        parentCategoryName: null,
        amount: "100",
        remainingRefundableAmount: "100",
      },
      {
        categoryName: "无明细ID",
        categoryType: "expense",
        parentCategoryName: null,
        amount: "100",
        remainingRefundableAmount: "100",
      },
    ],
  });
  it("只展开可识别的支出并保留核销金额和商家账户元数据", () => {
    expect(toTransactionLinkCandidates([record])).toEqual([
      expect.objectContaining({
        id: "expense",
        amount: "100",
        remainingRefundableAmount: "-20",
        refundedAmount: "50",
        reimbursementAmount: "70",
        merchantName: record.merchant_name,
        accountName: record.account_name,
      }),
    ]);
  });
  it("候选可携带原支出首个付款账户的 ID", () => {
    const candidates = toTransactionLinkCandidates([
      { ...record, account_id: "account-1" },
    ]);
    expect(candidates[0]?.accountId).toBe("account-1");
    expect(toTransactionLinkCandidates([record])[0]?.accountId).toBeUndefined();
    const withMerchant = { ...record, merchant_id: "merchant-1" };
    expect(toTransactionLinkCandidates([withMerchant])[0]?.merchantId).toBe(
      "merchant-1",
    );
  });
  it("以剩余金额是否大于零区分未结清和已结清", () => {
    const candidate = toTransactionLinkCandidates([record])[0];
    expect(isLinkCandidateSettled(candidate)).toBe(true);
    expect(
      isLinkCandidateSettled({
        ...candidate,
        remainingRefundableAmount: "0",
      }),
    ).toBe(true);
    expect(
      isLinkCandidateSettled({
        ...candidate,
        remainingRefundableAmount: "0.01",
      }),
    ).toBe(false);
  });
  it.each([
    ["0", ""],
    ["-20", ""],
    ["12.345", "12.345"],
  ])("剩余金额 %s 的默认值为 %s", (remainingRefundableAmount, expected) => {
    const candidate = {
      ...toTransactionLinkCandidates([record])[0],
      remainingRefundableAmount,
    };
    expect(getLinkCandidateDefaultAmount(candidate)).toBe(expected);
  });
  describe("小票中的实时核销", () => {
    const candidate = {
      ...toTransactionLinkCandidates([record])[0],
      amount: "100",
      refundedAmount: "60",
      reimbursementAmount: "10",
      remainingRefundableAmount: "30",
    };
    const refund = { id: candidate.id };
    const reimbursement = { id: candidate.id };

    it("编辑时删除已保存的退款关联会恢复剩余", () => {
      const result = adjustLinkCandidate(
        candidate,
        [],
        [{ amount: "60", refundCandidate: refund }],
      );
      expect(result.remainingRefundableAmount).toBe("90");
      expect(result.refundedAmount).toBe("0");
    });

    it("正在编辑的旧明细不重复扣减，其他草稿明细仍然生效", () => {
      const result = adjustLinkCandidate(
        candidate,
        [
          { id: 1, amount: "80", refundCandidate: refund },
          { id: 2, amount: "15", refundCandidate: refund },
        ],
        [{ amount: "60", refundCandidate: refund }],
        1,
      );
      expect(result.remainingRefundableAmount).toBe("75");
    });

    it("修改已保存金额后以新金额核销", () => {
      const result = adjustLinkCandidate(
        candidate,
        [{ id: 1, amount: "20", refundCandidate: refund }],
        [{ amount: "60", refundCandidate: refund }],
      );
      expect(result.remainingRefundableAmount).toBe("70");
      expect(result.refundedAmount).toBe("20");
    });

    it("改选其他目标后旧原支出恢复剩余", () => {
      const result = adjustLinkCandidate(
        candidate,
        [{ id: 1, amount: "20", refundCandidate: { id: "other" } }],
        [{ amount: "60", refundCandidate: refund }],
      );
      expect(result.remainingRefundableAmount).toBe("90");
      expect(result.refundedAmount).toBe("0");
    });

    it("核销超额的负剩余保持符号，删掉旧关联可恢复为正数", () => {
      const result = adjustLinkCandidate(
        {
          ...candidate,
          refundedAmount: "60",
          reimbursementAmount: "60",
          remainingRefundableAmount: "-20",
        },
        [],
        [{ amount: "30", refundCandidate: refund }],
      );
      expect(result.refundedAmount).toBe("30");
      expect(result.remainingRefundableAmount).toBe("10");
    });

    it("同一张小票两笔退款和一笔报销一起核销，零金额不抵消", () => {
      const result = adjustLinkCandidate(
        candidate,
        [
          { id: 1, amount: "12", refundCandidate: refund },
          { id: 2, amount: "7", refundCandidate: refund },
          { id: 3, amount: "8", reimbursementCandidate: reimbursement },
          { id: 4, amount: "0", refundCandidate: refund },
        ],
        [],
      );
      expect(result.refundedAmount).toBe("79");
      expect(result.reimbursementAmount).toBe("18");
      expect(result.remainingRefundableAmount).toBe("3");
    });
  });
});
