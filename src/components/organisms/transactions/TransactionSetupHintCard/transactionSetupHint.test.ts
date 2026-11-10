import { describe, expect, it } from "vitest";

import { transactionSetupHintMessages } from "config/transactionMessages";

import { getTransferTransactionSetupHint } from "./transactionSetupHint";

describe("getTransferTransactionSetupHint", () => {
  it("没有账户时提示还差两个账户", () => {
    expect(getTransferTransactionSetupHint(0)).toEqual(
      transactionSetupHintMessages.transferMissingTwoAccounts,
    );
  });

  it("只有一个账户时提示还差一个账户", () => {
    expect(getTransferTransactionSetupHint(1)).toEqual(
      transactionSetupHintMessages.transferMissingOneAccount,
    );
  });

  it("有两个以上账户时不提示", () => {
    expect(getTransferTransactionSetupHint(2)).toBeNull();
    expect(getTransferTransactionSetupHint(3)).toBeNull();
  });
});
