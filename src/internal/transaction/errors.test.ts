import { describe, expect, it } from "vitest";

import {
  getTransactionValidationErrorMessage,
  getUpdateTransactionValidationErrorMessage,
  getVoidTransactionValidationErrorMessage,
  transactionErrorCodes,
} from "internal/transaction/errors";

describe("transaction errors", () => {
  it("返回新增与编辑共用的校验错误文案", () => {
    expect(
      getTransactionValidationErrorMessage(transactionErrorCodes.amountInvalid),
    ).toBe("金额不能为负数，且最多两位小数。");
    expect(
      getUpdateTransactionValidationErrorMessage(
        transactionErrorCodes.categoryInvalid,
      ),
    ).toBe("分类指定不正确。");
    expect(
      getTransactionValidationErrorMessage(
        transactionErrorCodes.reimbursementLinkInvalid,
      ),
    ).toBe("报销目标明细不正确。");
  });

  it("返回编辑对象错误文案", () => {
    expect(
      getUpdateTransactionValidationErrorMessage(
        transactionErrorCodes.updateInvalid,
      ),
    ).toBe("编辑对象不正确。");
  });

  it("返回删除对象错误文案", () => {
    expect(
      getVoidTransactionValidationErrorMessage(
        transactionErrorCodes.voidInvalid,
      ),
    ).toBe("删除对象不正确。");
  });

  it("未知错误码返回 null", () => {
    expect(getTransactionValidationErrorMessage("unknown")).toBeNull();
    expect(getUpdateTransactionValidationErrorMessage("unknown")).toBeNull();
    expect(getVoidTransactionValidationErrorMessage("unknown")).toBeNull();
  });
});
