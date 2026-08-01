import { describe, expect, it } from "vitest";
import { transactionErrorCodes } from "./errors";
import {
  convertTransactionRequestSchema,
  createTransactionRequestSchema,
  validateTransactionForm,
  validateVoidTransactionForm,
  validateConvertTransactionTypeForm,
  validateUpdateTransactionForm,
  validateUpdateTransferTransactionForm,
} from "./schema";
describe("\u4EA4\u6613\u521B\u5EFA\u6821\u9A8C", () => {
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
      const result = validateTransactionForm(
        createFormData({ type: "income" }),
      );
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
      expect(
        validateTransactionForm(createFormData({ merchantId: "" })),
      ).toEqual({
        error: "merchant_invalid",
        ok: false,
      });
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
});
describe("validateConvertTransactionTypeForm", () => {
  const accountId = "00000000-0000-4000-8000-000000000041";
  const toAccountId = "00000000-0000-4000-8000-000000000042";
  const categoryId = "00000000-0000-4000-8000-000000000101";
  const merchantId = "00000000-0000-4000-8000-000000001001";
  const transactionRecordId = "00000000-0000-4000-8000-000000002001";
  function createNormalFormData(overrides: Record<string, string> = {}) {
    const formData = new FormData();
    formData.set("transactionRecordId", transactionRecordId);
    formData.set("sourceType", "transfer");
    formData.set("type", "expense");
    formData.set("transactionAt", "2026-06-04T10:30:05");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", accountId);
    formData.append("itemCategoryId", categoryId);
    formData.append("itemAmount", "1200");
    formData.set("merchantId", merchantId);
    formData.set("note", "转换记录");
    for (const [key, value] of Object.entries(overrides)) {
      formData.set(key, value);
    }
    return formData;
  }
  function createTransferFormData(overrides: Record<string, string> = {}) {
    const formData = new FormData();
    formData.set("transactionRecordId", transactionRecordId);
    formData.set("sourceType", "expense");
    formData.set("type", "transfer");
    formData.set("transactionAt", "2026-06-04T10:30:05");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", accountId);
    formData.set("transferTargetAccountId", toAccountId);
    formData.set("transferAmount", "1200");
    formData.set("note", "转为转账");
    for (const [key, value] of Object.entries(overrides)) {
      formData.set(key, value);
    }
    return formData;
  }
  it("sourceType 缺失时拒绝", () => {
    expect(
      validateConvertTransactionTypeForm(
        createNormalFormData({ sourceType: "" }),
      ),
    ).toEqual({ error: "update_invalid", ok: false });
  });
  it("targetType（type 字段）缺失时拒绝", () => {
    expect(
      validateConvertTransactionTypeForm(createNormalFormData({ type: "" })),
    ).toEqual({ error: "update_invalid", ok: false });
  });
  it("sourceType = targetType 时拒绝", () => {
    expect(
      validateConvertTransactionTypeForm(
        createNormalFormData({ sourceType: "expense", type: "expense" }),
      ),
    ).toEqual({ error: "update_invalid", ok: false });
  });
  it("转账 → 普通交易 0 元明细不被 validator 拒绝", () => {
    expect(
      validateConvertTransactionTypeForm(
        createNormalFormData({ itemAmount: "0" }),
      ),
    ).toMatchObject({
      ok: true,
      value: expect.objectContaining({
        items: [{ amount: 0, categoryId }],
        targetType: "expense",
      }),
    });
  });
  it("转账 → 普通交易 校验通过并返回正确参数", () => {
    expect(validateConvertTransactionTypeForm(createNormalFormData())).toEqual({
      ok: true,
      value: {
        accountId,
        items: [{ amount: 1200, categoryId }],
        merchantId,
        note: "转换记录",
        transactionAt: "2026-06-04T01:30:05.000Z",
        transactionRecordId,
        type: "expense",
        sourceType: "transfer",
        targetType: "expense",
      },
    });
  });
  it("转账 → 收入 校验通过并返回正确参数", () => {
    expect(
      validateConvertTransactionTypeForm(
        createNormalFormData({ type: "income" }),
      ),
    ).toEqual({
      ok: true,
      value: {
        accountId,
        items: [{ amount: 1200, categoryId }],
        merchantId,
        note: "转换记录",
        transactionAt: "2026-06-04T01:30:05.000Z",
        transactionRecordId,
        type: "income",
        sourceType: "transfer",
        targetType: "income",
      },
    });
  });
  it("普通交易 → 转账 校验通过并返回正确参数", () => {
    expect(
      validateConvertTransactionTypeForm(createTransferFormData()),
    ).toEqual({
      ok: true,
      value: {
        accountId,
        note: "转为转账",
        transactionAt: "2026-06-04T01:30:05.000Z",
        transactionRecordId,
        transferAmount: 1200,
        transferTargetAccountId: toAccountId,
        type: "transfer",
        sourceType: "expense",
        targetType: "transfer",
      },
    });
  });
  it("普通交易 → 转账 转账金额为 0 时拒绝", () => {
    expect(
      validateConvertTransactionTypeForm(
        createTransferFormData({ transferAmount: "0" }),
      ),
    ).toEqual({ error: "amount_invalid", ok: false });
  });
  it("普通交易 → 转账 from/to 账户相同时拒绝", () => {
    expect(
      validateConvertTransactionTypeForm(
        createTransferFormData({ transferTargetAccountId: accountId }),
      ),
    ).toEqual({ error: "account_invalid", ok: false });
  });
});
describe("\u4EA4\u6613\u8868\u5355\u8FB9\u754C\u6821\u9A8C", () => {
  const accountId = "00000000-0000-4000-8000-000000000045";
  const categoryId = "00000000-0000-4000-8000-000000005072";
  const secondCategoryId = "00000000-0000-4000-8000-000000005074";
  const merchantId = "00000000-0000-4000-8000-000000001001";
  const transactionRecordId = "00000000-0000-4000-8000-000000009001";
  function createFormData(overrides: Record<string, string> = {}) {
    const formData = new FormData();
    formData.set("type", "expense");
    formData.set("transactionAt", "2026-06-05T12:20:10");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", accountId);
    formData.append("itemCategoryId", categoryId);
    formData.append("itemAmount", "1200");
    formData.set("merchantId", merchantId);
    formData.set("note", "测试备注");
    for (const [key, value] of Object.entries(overrides)) {
      formData.set(key, value);
    }
    return formData;
  }
  describe("validateTransactionForm regression", () => {
    it("接受多条明细、0 元金额和必填商家字段", () => {
      const formData = createFormData();
      formData.append("itemCategoryId", secondCategoryId);
      formData.append("itemAmount", "0");
      const result = validateTransactionForm(formData);
      expect(result).toEqual({
        ok: true,
        value: {
          accountId,
          items: [
            { amount: 1200, categoryId },
            { amount: 0, categoryId: secondCategoryId },
          ],
          merchantId,
          note: "测试备注",
          transactionAt: "2026-06-05T03:20:10.000Z",
          type: "expense",
        },
      });
    });
    it("商家为空时校验失败", () => {
      expect(
        validateTransactionForm(createFormData({ merchantId: "" })),
      ).toEqual({
        error: transactionErrorCodes.merchantInvalid,
        ok: false,
      });
    });
    it("明细分类与金额数量不一致时校验失败", () => {
      const formData = createFormData();
      formData.append("itemCategoryId", secondCategoryId);
      expect(validateTransactionForm(formData)).toEqual({
        error: transactionErrorCodes.amountInvalid,
        ok: false,
      });
    });
    it("明细金额为负数时校验失败", () => {
      expect(
        validateTransactionForm(createFormData({ itemAmount: "-1" })),
      ).toEqual({
        error: transactionErrorCodes.amountInvalid,
        ok: false,
      });
    });
    it("逐条解析特殊状态并保留无特殊状态", () => {
      const formData = createFormData();
      formData.append("itemCategoryId", secondCategoryId);
      formData.append("itemAmount", "45");
      formData.append("itemSpecialStatus", "excluded");
      formData.append("itemSpecialStatus", "");

      expect(validateTransactionForm(formData)).toMatchObject({
        ok: true,
        value: {
          items: [
            { amount: 1200, categoryId, specialStatus: "excluded" },
            {
              amount: 45,
              categoryId: secondCategoryId,
              specialStatus: null,
            },
          ],
        },
      });
    });
    it("拒绝未知的特殊状态", () => {
      const formData = createFormData();
      formData.append("itemSpecialStatus", "unknown");

      expect(validateTransactionForm(formData)).toEqual({
        error: transactionErrorCodes.specialStatusInvalid,
        ok: false,
      });
    });
  });
  describe("validateUpdateTransactionForm regression", () => {
    it("keeps transactionRecordId and parses multiple edited items", () => {
      const formData = createFormData({ transactionRecordId });
      formData.append("itemCategoryId", secondCategoryId);
      formData.append("itemAmount", "45");
      expect(validateUpdateTransactionForm(formData)).toEqual({
        ok: true,
        value: {
          accountId,
          items: [
            { amount: 1200, categoryId },
            { amount: 45, categoryId: secondCategoryId },
          ],
          merchantId,
          note: "测试备注",
          transactionAt: "2026-06-05T03:20:10.000Z",
          transactionRecordId,
          type: "expense",
        },
      });
    });
    it("transactionRecordId 不合法时在解析更新值之前校验失败", () => {
      expect(
        validateUpdateTransactionForm(
          createFormData({ transactionRecordId: "invalid-id" }),
        ),
      ).toEqual({
        error: transactionErrorCodes.updateInvalid,
        ok: false,
      });
    });
  });
});
describe("transfer transaction validators", () => {
  const fromAccountId = "00000000-0000-4000-8000-000000000041";
  const toAccountId = "00000000-0000-4000-8000-000000000042";
  const categoryId = "00000000-0000-4000-8000-000000000101";
  const transactionRecordId = "00000000-0000-4000-8000-000000002001";
  function createTransferFormData(overrides: Record<string, string> = {}) {
    const formData = new FormData();
    formData.set("type", "transfer");
    formData.set("transactionAt", "2026-06-04T10:30:05");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", fromAccountId);
    formData.set("transferTargetAccountId", toAccountId);
    formData.set("transferAmount", "1200");
    formData.set("note", "账户转账");
    // validateUpdateTransactionForm 的测试也复用此 helper，故需要包含该字段
    // validateTransactionForm 不读取该字段，可安全忽略
    formData.set("transactionRecordId", transactionRecordId);
    for (const [key, value] of Object.entries(overrides)) {
      formData.set(key, value);
    }
    return formData;
  }
  it("转账交易表单校验通过", () => {
    expect(validateTransactionForm(createTransferFormData())).toEqual({
      ok: true,
      value: {
        accountId: fromAccountId,
        note: "账户转账",
        transactionAt: "2026-06-04T01:30:05.000Z",
        transferAmount: 1200,
        transferTargetAccountId: toAccountId,
        type: "transfer",
      },
    });
  });
  it("转账不要求商家和分类", () => {
    const formData = createTransferFormData({ merchantId: "" });
    formData.append("itemCategoryId", categoryId);
    formData.append("itemAmount", "1200");
    expect(validateTransactionForm(formData)).toEqual({
      ok: true,
      value: {
        accountId: fromAccountId,
        note: "账户转账",
        transactionAt: "2026-06-04T01:30:05.000Z",
        transferAmount: 1200,
        transferTargetAccountId: toAccountId,
        type: "transfer",
      },
    });
  });
  it("拒绝转出和转入账户相同", () => {
    expect(
      validateTransactionForm(
        createTransferFormData({ transferTargetAccountId: fromAccountId }),
      ),
    ).toEqual({
      error: "account_invalid",
      ok: false,
    });
  });
  it("拒绝非法转账金额", () => {
    expect(
      validateTransactionForm(createTransferFormData({ transferAmount: "0" })),
    ).toEqual({
      error: "amount_invalid",
      ok: false,
    });
  });
  it("普通编辑校验拒绝 transfer", () => {
    expect(validateUpdateTransactionForm(createTransferFormData())).toEqual({
      error: "update_invalid",
      ok: false,
    });
  });
  it("普通编辑校验在 transfer 字段不足时也直接拒绝", () => {
    const formData = new FormData();
    formData.set("transactionRecordId", transactionRecordId);
    formData.set("type", "transfer");
    expect(validateUpdateTransactionForm(formData)).toEqual({
      error: "update_invalid",
      ok: false,
    });
  });
});
describe("validateUpdateTransferTransactionForm", () => {
  const fromAccountId = "00000000-0000-4000-8000-000000000041";
  const toAccountId = "00000000-0000-4000-8000-000000000042";
  const transactionRecordId = "00000000-0000-4000-8000-000000002001";
  function createTransferUpdateFormData(
    overrides: Record<string, string> = {},
  ) {
    const formData = new FormData();
    formData.set("transactionRecordId", transactionRecordId);
    formData.set("type", "transfer");
    formData.set("transactionAt", "2026-06-04T10:30:05");
    formData.set("timeZoneOffsetMinutes", "-540");
    formData.set("accountId", fromAccountId);
    formData.set("transferTargetAccountId", toAccountId);
    formData.set("transferAmount", "5000");
    formData.set("note", "账户转账");
    for (const [key, value] of Object.entries(overrides)) {
      formData.set(key, value);
    }
    return formData;
  }
  it("转账编辑表单校验通过", () => {
    expect(
      validateUpdateTransferTransactionForm(createTransferUpdateFormData()),
    ).toEqual({
      ok: true,
      value: {
        accountId: fromAccountId,
        note: "账户转账",
        transactionAt: "2026-06-04T01:30:05.000Z",
        transactionRecordId,
        transferAmount: 5000,
        transferTargetAccountId: toAccountId,
        type: "transfer",
      },
    });
  });
  it("缺少 transactionRecordId 时返回 update_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ transactionRecordId: "" }),
      ),
    ).toEqual({ error: "update_invalid", ok: false });
  });
  it("非法 transactionRecordId 时返回 update_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ transactionRecordId: "not-a-uuid" }),
      ),
    ).toEqual({ error: "update_invalid", ok: false });
  });
  it("type 不是 transfer 时返回 update_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ type: "expense" }),
      ),
    ).toEqual({ error: "update_invalid", ok: false });
  });
  it("转出和转入账户相同时返回 account_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({
          transferTargetAccountId: fromAccountId,
        }),
      ),
    ).toEqual({ error: "account_invalid", ok: false });
  });
  it("金额为 0 时返回 amount_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ transferAmount: "0" }),
      ),
    ).toEqual({ error: "amount_invalid", ok: false });
  });
  it("金额为空时返回 amount_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ transferAmount: "" }),
      ),
    ).toEqual({ error: "amount_invalid", ok: false });
  });
  it("金额为负数时返回 amount_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ transferAmount: "-100" }),
      ),
    ).toEqual({ error: "amount_invalid", ok: false });
  });
  it("金额格式错误时返回 amount_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ transferAmount: "abc" }),
      ),
    ).toEqual({ error: "amount_invalid", ok: false });
  });
  it("日期非法时返回 date_invalid", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ transactionAt: "invalid-date" }),
      ),
    ).toEqual({ error: "date_invalid", ok: false });
  });
  it("备注超过 2000 字时返回 note_too_long", () => {
    expect(
      validateUpdateTransferTransactionForm(
        createTransferUpdateFormData({ note: "あ".repeat(2001) }),
      ),
    ).toEqual({ error: "note_too_long", ok: false });
  });
});
describe("validateUpdateTransactionForm", () => {
  const accountId = "00000000-0000-4000-8000-000000000041";
  const categoryId = "00000000-0000-4000-8000-000000000101";
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
  it("update 普通交易允许 type=expense", () => {
    expect(validateUpdateTransactionForm(createFormData())).toEqual({
      ok: true,
      value: {
        accountId,
        items: [{ amount: 1200, categoryId }],
        merchantId,
        note: "测试记录",
        transactionAt: "2026-06-04T01:30:05.000Z",
        transactionRecordId,
        type: "expense",
      },
    });
  });
  it("update 普通交易允许 type=income", () => {
    expect(
      validateUpdateTransactionForm(createFormData({ type: "income" })),
    ).toEqual({
      ok: true,
      value: {
        accountId,
        items: [{ amount: 1200, categoryId }],
        merchantId,
        note: "测试记录",
        transactionAt: "2026-06-04T01:30:05.000Z",
        transactionRecordId,
        type: "income",
      },
    });
  });
  it("update 普通交易拒绝 type=transfer", () => {
    expect(
      validateUpdateTransactionForm(createFormData({ type: "transfer" })),
    ).toEqual({
      error: "update_invalid",
      ok: false,
    });
  });
});
