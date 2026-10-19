import { describe, expect, it } from "vitest";

import {
  listRecordAccountMovements,
  requireItemAccountId,
} from "./recordAccounts";
import {
  hospitalItems,
  hospitalPayments,
  hospitalRecord,
} from "./splitPayment.testUtils";

const transferItems = [
  { account_id: "account-from", balance_delta: "-100" },
  { account_id: "account-to", balance_delta: "100" },
];

describe("listRecordAccountMovements", () => {
  it("普通记录取付款明细，不读明细账户", () => {
    expect(
      listRecordAccountMovements(
        hospitalRecord,
        hospitalItems,
        hospitalPayments,
      ),
    ).toEqual(
      hospitalPayments.map((payment) => ({
        accountId: payment.account_id,
        balanceDelta: payment.balance_delta,
      })),
    );
  });

  it("转账取明细账户", () => {
    expect(
      listRecordAccountMovements({ type: "transfer" }, transferItems, []),
    ).toEqual([
      { accountId: "account-from", balanceDelta: "-100" },
      { accountId: "account-to", balanceDelta: "100" },
    ]);
  });
});

describe("requireItemAccountId", () => {
  it("返回转账 / 余额调整明细上的账户", () => {
    expect(requireItemAccountId({ account_id: "account-from" })).toBe(
      "account-from",
    );
  });

  it("明细缺少账户时抛错", () => {
    expect(() => requireItemAccountId({ account_id: null })).toThrow(Error);
  });
});
