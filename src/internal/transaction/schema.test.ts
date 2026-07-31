import { describe, expect, it } from "vitest";

import { transactionErrorCodes } from "./errors";
import {
  convertTransactionRequestSchema,
  createTransactionRequestSchema,
  validateTransactionForm,
  validateVoidTransactionForm,
} from "./schema";

const accountId = "00000000-0000-4000-8000-000000000041";
const otherAccountId = "00000000-0000-4000-8000-000000000042";
const categoryId = "00000000-0000-4000-8000-000000000101";
const ledgerId = "00000000-0000-4000-8000-000000000032";
const merchantId = "00000000-0000-4000-8000-000000001001";
const transactionRecordId = "00000000-0000-4000-8000-000000002001";

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set("type", "expense");
  formData.set("transactionAt", "2026-06-04T10:30:05");
  formData.set("timeZoneOffsetMinutes", "-540");
  formData.set("accountId", accountId);
  formData.append("itemCategoryId", categoryId);
  formData.append("itemAmount", "1200");
  formData.set("merchantId", merchantId);
  formData.set("note", "测试记录");
  formData.set("transactionRecordId", transactionRecordId);

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

describe("transaction validators", () => {
  it("支出交易表单校验通过", () => {
    expect(validateTransactionForm(createFormData())).toEqual({
      ok: true,
      value: {
        accountId,
        items: [{ amount: 1200, categoryId }],
        merchantId,
        note: "测试记录",
        transactionAt: "2026-06-04T01:30:05.000Z",
        type: "expense",
      },
    });
  });

  it("收入交易表单校验通过", () => {
    const result = validateTransactionForm(createFormData({ type: "income" }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.type).toBe("income");
  });

  it("允许 0 元明细", () => {
    expect(
      validateTransactionForm(createFormData({ itemAmount: "0" })),
    ).toEqual({
      ok: true,
      value: {
        accountId,
        items: [{ amount: 0, categoryId }],
        merchantId,
        note: "测试记录",
        transactionAt: "2026-06-04T01:30:05.000Z",
        type: "expense",
      },
    });
  });

  it("拒绝非法金额", () => {
    expect(
      validateTransactionForm(createFormData({ itemAmount: "-1" })),
    ).toEqual({
      error: "amount_invalid",
      ok: false,
    });
  });

  it("多条明细表单校验通过", () => {
    const formData = createFormData();
    const secondCategoryId = "00000000-0000-4000-8000-000000000102";

    formData.append("itemCategoryId", secondCategoryId);
    formData.append("itemAmount", "45");

    expect(validateTransactionForm(formData)).toEqual({
      ok: true,
      value: {
        accountId,
        items: [
          { amount: 1200, categoryId },
          { amount: 45, categoryId: secondCategoryId },
        ],
        merchantId,
        note: "测试记录",
        transactionAt: "2026-06-04T01:30:05.000Z",
        type: "expense",
      },
    });
  });

  it("拒绝非法时间", () => {
    expect(
      validateTransactionForm(
        createFormData({ transactionAt: "2026-02-30T10:30:05" }),
      ),
    ).toEqual({
      error: "date_invalid",
      ok: false,
    });
  });

  it("拒绝过长备注", () => {
    expect(
      validateTransactionForm(createFormData({ note: "あ".repeat(2001) })),
    ).toEqual({
      error: "note_too_long",
      ok: false,
    });
  });

  it("拒绝未指定商家", () => {
    expect(validateTransactionForm(createFormData({ merchantId: "" }))).toEqual(
      {
        error: "merchant_invalid",
        ok: false,
      },
    );
  });

  it("允许备注为空", () => {
    const result = validateTransactionForm(createFormData({ note: "" }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.note).toBeNull();
    }
  });

  it("void 交易表单校验通过", () => {
    expect(validateVoidTransactionForm(createFormData())).toEqual({
      ok: true,
      value: { transactionRecordId },
    });
  });

  it("void 交易拒绝非法 ID", () => {
    expect(
      validateVoidTransactionForm(
        createFormData({ transactionRecordId: "invalid" }),
      ),
    ).toEqual({
      error: "void_invalid",
      ok: false,
    });
  });
});

describe("transaction request schema", () => {
  it("拒绝转出与转入账户相同的转账创建请求", () => {
    const result = createTransactionRequestSchema.safeParse({
      accountId,
      ledgerId,
      note: null,
      transactionAt: "2026-06-04T01:00:00.000Z",
      transferAmount: 1200,
      transferTargetAccountId: accountId,
      type: "transfer",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        transactionErrorCodes.accountInvalid,
      );
    }
  });

  it("拒绝转出与转入账户相同的转账转换请求", () => {
    const result = convertTransactionRequestSchema.safeParse({
      accountId,
      ledgerId,
      note: null,
      targetType: "transfer",
      transactionAt: "2026-06-04T01:00:00.000Z",
      transferAmount: 1200,
      transferTargetAccountId: accountId,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        transactionErrorCodes.accountInvalid,
      );
    }
  });

  it("接受账户不同的转账创建请求", () => {
    const result = createTransactionRequestSchema.safeParse({
      accountId,
      ledgerId,
      note: null,
      transactionAt: "2026-06-04T01:00:00.000Z",
      transferAmount: 1200,
      transferTargetAccountId: otherAccountId,
      type: "transfer",
    });

    expect(result.success).toBe(true);
  });

  it("拒绝超过 2 位小数的普通交易金额", () => {
    const result = createTransactionRequestSchema.safeParse({
      accountId,
      items: [{ amount: 12.345, categoryId }],
      ledgerId,
      merchantId,
      note: null,
      transactionAt: "2026-06-04T01:00:00.000Z",
      type: "expense",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        transactionErrorCodes.amountInvalid,
      );
    }
  });

  it("拒绝超过 2 位小数的转账金额", () => {
    const result = createTransactionRequestSchema.safeParse({
      accountId,
      ledgerId,
      note: null,
      transactionAt: "2026-06-04T01:00:00.000Z",
      transferAmount: 12.345,
      transferTargetAccountId: otherAccountId,
      type: "transfer",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        transactionErrorCodes.amountInvalid,
      );
    }
  });

  it("接受最多 2 位小数的金额", () => {
    const result = createTransactionRequestSchema.safeParse({
      accountId,
      items: [{ amount: 12.3, categoryId }],
      ledgerId,
      merchantId,
      note: null,
      transactionAt: "2026-06-04T01:00:00.000Z",
      type: "expense",
    });

    expect(result.success).toBe(true);
  });
});
