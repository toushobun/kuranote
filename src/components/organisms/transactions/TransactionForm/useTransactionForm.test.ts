import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionTagOption,
} from "types/transactions";

import { useTransactionForm } from "./useTransactionForm";

const mocks = vi.hoisted(() => ({ markEditDirty: vi.fn() }));

vi.mock(
  "organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext",
  () => ({ useEditTransactionDirty: () => mocks.markEditDirty }),
);

const accountOptions: TransactionAccountOption[] = [
  { currency: "JPY", id: "account-1", name: "现金" },
];
const categoryOptions: TransactionCategoryOption[] = [
  {
    id: "expense-parent",
    name: "餐饮",
    parentId: null,
    parentName: null,
    type: "expense",
  },
  {
    id: "expense-child",
    name: "午餐",
    parentId: "expense-parent",
    parentName: "餐饮",
    type: "expense",
  },
  {
    id: "income-category",
    name: "工资",
    parentId: null,
    parentName: null,
    type: "income",
  },
];
const merchantOptions: TransactionMerchantOption[] = [
  { icon_url: null, id: "merchant-1", name: "便利店" },
];
const tagOptions: TransactionTagOption[] = [
  { color: null, id: "tag-1", name: "日常" },
  { color: null, id: "tag-2", name: "工作" },
];

function renderTransactionFormHook(
  overrides: Partial<Parameters<typeof useTransactionForm>[0]> = {},
) {
  return renderHook(() =>
    useTransactionForm({
      accountOptions,
      categoryOptions,
      merchantOptions,
      tagOptions,
      ...overrides,
    }),
  );
}

describe("useTransactionForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("按分类类型初始化明细并计算收支净额", async () => {
    const { result } = renderTransactionFormHook({
      initialValues: {
        accountId: "account-1",
        items: [
          { amount: "1200", categoryId: "expense-child" },
          { amount: "500", categoryId: "income-category" },
        ],
        merchantId: "merchant-1",
        note: "混合收支",
        tagNames: ["日常"],
        transactionAt: "2026-07-20T01:30:00.000Z",
        type: "expense",
      },
    });

    await waitFor(() => expect(result.current.transactionDate).not.toBe(""));
    expect(result.current.itemSummaries).toHaveLength(2);
    expect(
      result.current.itemSummaries.map((item) => item.category?.type),
    ).toEqual(["expense", "income"]);
    expect(result.current.signedTotalAmount).toBe("-700");
    expect(result.current.selectedAccount?.name).toBe("现金");
    expect(result.current.selectedMerchant?.name).toBe("便利店");
  });

  it("明细选择器先返回校验错误，再追加有效明细", () => {
    const { result } = renderTransactionFormHook();

    act(() => result.current.openSheet());
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(false);
    });
    expect(result.current.pickerErrors).toEqual({
      amount: expect.any(String),
      category: expect.any(String),
    });

    act(() => {
      result.current.handlePickerCategoryToggle("expense-child");
      result.current.handlePickerAmountChange("1200");
    });
    act(() => {
      expect(result.current.handlePickerAdd()).toBe(true);
    });

    expect(result.current.itemSummaries).toHaveLength(1);
    expect(result.current.itemSummaries[0]).toMatchObject({
      amount: "1200",
      categoryId: "expense-child",
    });
    expect(result.current.signedTotalAmount).toBe("-1200");
    expect(mocks.markEditDirty).toHaveBeenCalled();
  });

  it("新增标签时去除空格并阻止大小写重复", () => {
    const { result } = renderTransactionFormHook();

    act(() => result.current.addTag("  日常  "));
    expect(result.current.selectedTagNames).toEqual(["日常"]);
    expect(result.current.newTagName).toBe("");

    act(() => result.current.addTag("日常"));
    expect(result.current.selectedTagNames).toEqual(["日常"]);
    expect(result.current.fieldErrors.tags).toBeTruthy();
  });

  it("提交缺少必填业务字段的表单时阻止提交并返回字段错误", async () => {
    const { result } = renderTransactionFormHook();
    const preventDefault = vi.fn();

    await waitFor(() => expect(result.current.transactionAtValue).not.toBe(""));
    act(() =>
      result.current.handleSubmit({
        preventDefault,
      } as unknown as Parameters<typeof result.current.handleSubmit>[0]),
    );

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(result.current.fieldErrors).toMatchObject({
      account: expect.any(String),
      items: expect.any(String),
      merchant: expect.any(String),
    });
  });
});
