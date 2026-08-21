// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  getLinkedEditExpectedUpdatedAtFieldName,
  parseLinkedEditActionInput,
  validateLinkedEditTransactionForm,
} from "internal/transaction/adapter/next/linkedEditInput";
import { transactionErrorCodes } from "internal/transaction/errors";

const firstItemId = "00000000-0000-4000-8000-000000000201";
const secondItemId = "00000000-0000-4000-8000-000000000202";
const accountId = "00000000-0000-4000-8000-000000000045";
const categoryId = "00000000-0000-4000-8000-000000005072";
const merchantId = "00000000-0000-4000-8000-000000001001";
const transactionRecordId = "00000000-0000-4000-8000-000000009999";

function createEditFormData(specialStatus: string) {
  const formData = new FormData();
  formData.set("type", "expense");
  formData.set("transactionRecordId", transactionRecordId);
  formData.set("transactionAt", "2026-08-21T10:30:05");
  formData.set("timeZoneOffsetMinutes", "-540");
  formData.set("accountId", accountId);
  formData.append("itemCategoryId", categoryId);
  formData.append("itemAmount", "1200");
  formData.append("itemPersistedId", firstItemId);
  formData.append("itemSpecialStatus", specialStatus);
  formData.set("merchantId", merchantId);
  return formData;
}

describe("validateLinkedEditTransactionForm", () => {
  it.each(["reimbursed", "reimbursementSurplus"] as const)(
    "编辑已关联交易时允许原样回传派生状态 %s",
    (specialStatus) => {
      expect(
        validateLinkedEditTransactionForm(createEditFormData(specialStatus)),
      ).toMatchObject({
        ok: true,
        value: {
          items: [
            {
              id: firstItemId,
              specialStatus,
            },
          ],
        },
      });
    },
  );

  it("编辑已关联交易时拒绝未知特殊状态", () => {
    expect(
      validateLinkedEditTransactionForm(createEditFormData("unknown")),
    ).toEqual({
      error: transactionErrorCodes.specialStatusInvalid,
      ok: false,
    });
  });
});

describe("parseLinkedEditActionInput", () => {
  it("未确认且没有版本字段时返回普通保存信号", () => {
    expect(parseLinkedEditActionInput(new FormData(), [firstItemId])).toEqual({
      confirmSync: false,
      expectedUpdatedAtByItemId: {},
    });
  });

  it("按明细 ID 解析确认信号和乐观锁版本，不依赖字段顺序", () => {
    const formData = new FormData();
    formData.set("confirmSync", "true");
    formData.append(
      getLinkedEditExpectedUpdatedAtFieldName(secondItemId),
      "2026-08-21T10:01:00+09:00",
    );
    formData.append(
      getLinkedEditExpectedUpdatedAtFieldName(firstItemId),
      "2026-08-21T01:00:00.000Z",
    );

    expect(
      parseLinkedEditActionInput(formData, [firstItemId, secondItemId]),
    ).toEqual({
      confirmSync: true,
      expectedUpdatedAtByItemId: {
        [firstItemId]: "2026-08-21T01:00:00.000Z",
        [secondItemId]: "2026-08-21T10:01:00+09:00",
      },
    });
  });

  it("拒绝客户端伪造的确认值", () => {
    const formData = new FormData();
    formData.set("confirmSync", "yes");

    expect(parseLinkedEditActionInput(formData, [firstItemId])).toBeNull();
  });

  it("拒绝旧版位置字段、未知明细或不带时区的版本字段", () => {
    const positionalField = new FormData();
    positionalField.append("itemExpectedUpdatedAt", "2026-08-21T01:00:00.000Z");
    expect(
      parseLinkedEditActionInput(positionalField, [firstItemId]),
    ).toBeNull();

    const unknownItem = new FormData();
    unknownItem.append(
      getLinkedEditExpectedUpdatedAtFieldName(secondItemId),
      "2026-08-21T01:00:00.000Z",
    );
    expect(parseLinkedEditActionInput(unknownItem, [firstItemId])).toBeNull();

    const invalidTimestamp = new FormData();
    invalidTimestamp.append(
      getLinkedEditExpectedUpdatedAtFieldName(firstItemId),
      "2026-08-21T10:00:00",
    );
    expect(
      parseLinkedEditActionInput(invalidTimestamp, [firstItemId]),
    ).toBeNull();
  });

  it("拒绝同一明细的重复版本字段", () => {
    const formData = new FormData();
    const fieldName = getLinkedEditExpectedUpdatedAtFieldName(firstItemId);
    formData.append(fieldName, "2026-08-21T01:00:00.000Z");
    formData.append(fieldName, "2026-08-21T01:01:00.000Z");

    expect(parseLinkedEditActionInput(formData, [firstItemId])).toBeNull();
  });
});
