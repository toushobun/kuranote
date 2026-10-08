import { describe, expect, it } from "vitest";

import { transactionSetupHintMessages } from "config/transactionMessages";

import {
  getNormalTransactionSetupHint,
  getTransferTransactionSetupHint,
} from "./transactionSetupHint";

describe("getNormalTransactionSetupHint", () => {
  it("账户和商家都没有时提示两者", () => {
    expect(
      getNormalTransactionSetupHint({ accountCount: 0, merchantCount: 0 }),
    ).toEqual({
      ...transactionSetupHintMessages.missingAccountAndMerchant,
      targets: ["account", "merchant"],
    });
  });

  it("只缺商家时只提示商家", () => {
    expect(
      getNormalTransactionSetupHint({ accountCount: 1, merchantCount: 0 }),
    ).toEqual({
      ...transactionSetupHintMessages.missingMerchant,
      targets: ["merchant"],
    });
  });

  it("只缺账户时只提示账户", () => {
    expect(
      getNormalTransactionSetupHint({ accountCount: 0, merchantCount: 2 }),
    ).toEqual({
      ...transactionSetupHintMessages.missingAccount,
      targets: ["account"],
    });
  });

  it("账户和商家都有时不提示", () => {
    expect(
      getNormalTransactionSetupHint({ accountCount: 1, merchantCount: 1 }),
    ).toBeNull();
  });
});

describe("getTransferTransactionSetupHint", () => {
  it("没有账户时提示还差两个账户", () => {
    expect(getTransferTransactionSetupHint(0)).toEqual({
      ...transactionSetupHintMessages.transferMissingTwoAccounts,
      targets: ["account"],
    });
  });

  it("只有一个账户时提示还差一个账户", () => {
    expect(getTransferTransactionSetupHint(1)).toEqual({
      ...transactionSetupHintMessages.transferMissingOneAccount,
      targets: ["account"],
    });
  });

  it("有两个以上账户时不提示", () => {
    expect(getTransferTransactionSetupHint(2)).toBeNull();
    expect(getTransferTransactionSetupHint(3)).toBeNull();
  });
});
