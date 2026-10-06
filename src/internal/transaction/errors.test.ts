import { describe, expect, it } from "vitest";

import {
  toTransactionActionErrorCode,
  transactionErrorCodes,
  transactionValidationErrorMessages,
  updateTransactionValidationErrorMessages,
  voidTransactionValidationErrorMessages,
} from "internal/transaction/errors";

describe("transaction errors", () => {
  it("返回新增与编辑共用的校验错误文案", () => {
    expect(
      transactionValidationErrorMessages[transactionErrorCodes.amountInvalid],
    ).toBe("金额不能为负数，且最多两位小数。");
    expect(
      updateTransactionValidationErrorMessages[
        transactionErrorCodes.categoryInvalid
      ],
    ).toBe("分类指定不正确。");
    expect(
      transactionValidationErrorMessages[
        transactionErrorCodes.reimbursementLinkInvalid
      ],
    ).toBe("报销目标明细不正确。");
  });

  it("返回编辑对象错误文案", () => {
    expect(
      updateTransactionValidationErrorMessages[
        transactionErrorCodes.updateInvalid
      ],
    ).toBe("编辑对象不正确。");
  });

  it("返回删除对象错误文案", () => {
    expect(
      voidTransactionValidationErrorMessages[transactionErrorCodes.voidInvalid],
    ).toBe("删除对象不正确。");
  });

  it("只把前端需要分支的错误码转换为 Action errorCode", () => {
    expect(
      toTransactionActionErrorCode(
        transactionErrorCodes.linkedSyncConfirmationRequired,
      ),
    ).toBe(transactionErrorCodes.linkedSyncConfirmationRequired);
    expect(
      toTransactionActionErrorCode(transactionErrorCodes.linkedDeleteForbidden),
    ).toBe(transactionErrorCodes.linkedDeleteForbidden);
    expect(
      toTransactionActionErrorCode(transactionErrorCodes.accountInvalid),
    ).toBeUndefined();
    expect(toTransactionActionErrorCode("unknown")).toBeUndefined();
  });
});
