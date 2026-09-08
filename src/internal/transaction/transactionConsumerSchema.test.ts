import { describe, expect, it } from "vitest";

import { transactionErrorCodes } from "internal/transaction/errors";
import { validateTransactionForm } from "internal/transaction/schema";

const accountId = "00000000-0000-4000-8000-000000000041";
const categoryId = "00000000-0000-4000-8000-000000000101";
const merchantId = "00000000-0000-4000-8000-000000001001";
const consumerA = "00000000-0000-4000-8000-000000000031";
const consumerB = "00000000-0000-4000-8000-000000000032";

function createFormData() {
  const formData = new FormData();
  formData.set("type", "expense");
  formData.set("transactionAt", "2026-09-08T12:30:00");
  formData.set("timeZoneOffsetMinutes", "-540");
  formData.set("accountId", accountId);
  formData.append("itemCategoryId", categoryId);
  formData.append("itemAmount", "1200");
  formData.set("merchantId", merchantId);
  formData.set("note", "");
  return formData;
}

describe("transaction consumer form schema", () => {
  it("接受多个消费者并按首次出现顺序去重", () => {
    const formData = createFormData();
    formData.append("consumerUserId", consumerA);
    formData.append("consumerUserId", consumerB);
    formData.append("consumerUserId", consumerA);

    const result = validateTransactionForm(formData);

    expect(result).toMatchObject({
      ok: true,
      value: { consumerUserIds: [consumerA, consumerB] },
    });
  });

  it("转账同样解析多个消费者", () => {
    const formData = new FormData();
    formData.set("type", "transfer");
    formData.set("transactionAt", "2026-09-08T12:30:00");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", accountId);
    formData.set(
      "transferTargetAccountId",
      "00000000-0000-4000-8000-000000000042",
    );
    formData.set("transferAmount", "1200");
    formData.append("consumerUserId", consumerA);
    formData.append("consumerUserId", consumerB);

    expect(validateTransactionForm(formData)).toMatchObject({
      ok: true,
      value: {
        consumerUserIds: [consumerA, consumerB],
        type: "transfer",
      },
    });
  });

  it("未提交消费者时保持 undefined 交由默认消费者逻辑处理", () => {
    const result = validateTransactionForm(createFormData());

    expect(result.ok).toBe(true);
    if (result.ok && result.value.type !== "transfer") {
      expect(result.value.consumerUserIds).toBeUndefined();
    }
  });

  it("拒绝非法消费者 ID", () => {
    const formData = createFormData();
    formData.append("consumerUserId", "invalid");

    expect(validateTransactionForm(formData)).toEqual({
      error: transactionErrorCodes.consumerInvalid,
      ok: false,
    });
  });
});
