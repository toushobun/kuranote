import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionMerchantOption,
  TransactionRefundCandidate,
} from "types/transactions";
import { useTransactionForm } from "./useTransactionForm";
import { useLinkExchangeRates } from "./useLinkExchangeRates";

const mocks = vi.hoisted(() => ({ fetchDaily: vi.fn(), markDirty: vi.fn() }));
vi.mock("lib/api/clientQuery", () => ({ fetchClientJson: mocks.fetchDaily }));
vi.mock("organisms/transactions/EditTransactionDirtyContext/EditTransactionDirtyContext",
  () => ({ useEditTransactionDirty: () => mocks.markDirty }));

const accountOptions: TransactionAccountOption[] = [
  { id: "cny", currency: "CNY", name: "收款账户" },
  { id: "jpy", currency: "JPY", name: "付款账户" },
];
const categoryOptions: TransactionCategoryOption[] = [
  { id: "income", type: "income", name: "收入", parentId: null, parentName: null },
  { id: "refund", type: "income", name: "退款", parentId: "income", parentName: "收入", systemKey: "refund" },
];
const merchantOptions: TransactionMerchantOption[] = [
  { id: "amazon", name: "Amazon", icon_url: null },
];
const original: TransactionRefundCandidate = {
  id: "original-item", transactionRecordId: "original-record",
  accountId: "jpy", accountCurrency: "JPY",
  amount: "2000", remainingRefundableAmount: "2000", refundedAmount: "0",
  merchantId: "amazon", categoryName: "键盘", parentCategoryName: "数码",
  transactionAt: "2026-11-19T09:00:00+09:00",
};
function useForm() {
  return useTransactionForm({
    accountOptions, categoryOptions, merchantOptions,
    initialValues: {
      type: "income", merchantId: "amazon", note: "",
      items: [], payments: [{ accountId: "cny", amount: null }],
      transactionAt: "2026-11-20T09:00:00+09:00",
    },
  });
}
async function selectOriginal(result: { current: ReturnType<typeof useTransactionForm> }) {
  act(() => result.current.openSheet());
  act(() => result.current.handlePickerModeChange("refund"));
  act(() => result.current.setPickerRefundCandidate(original));
  await waitFor(() => expect(mocks.fetchDaily).toHaveBeenCalledTimes(1));
}

describe("Issue #1147 跨币种候选默认金额", () => {
  beforeEach(() => { mocks.fetchDaily.mockReset(); mocks.markDirty.mockClear(); });

  it("第一次选原支出，汇率到达后自动换算剩余金额", async () => {
    let resolveDaily!: (value: { rate: number; rateDate: string }) => void;
    mocks.fetchDaily.mockImplementation(() => new Promise((resolve) => { resolveDaily = resolve; }));
    const { result } = renderHook(useForm);
    await selectOriginal(result);
    expect(result.current.pickerAmount).toBe("");
    await act(async () => resolveDaily({ rate: 23.8124, rateDate: "2026-11-20" }));
    await waitFor(() => expect(result.current.pickerAmount).toBe("83.99"));
  });

  it("用户在汇率到达之前输入金额，不覆盖手动输入", async () => {
    let resolveDaily!: (value: { rate: number; rateDate: string }) => void;
    mocks.fetchDaily.mockImplementation(() => new Promise((resolve) => { resolveDaily = resolve; }));
    const { result } = renderHook(useForm);
    await selectOriginal(result);
    act(() => result.current.setPickerAmount("70"));
    await act(async () => resolveDaily({ rate: 23.8124, rateDate: "2026-11-20" }));
    await waitFor(() => expect(result.current.pickerRateUnavailable).toBe(false));
    expect(result.current.pickerAmount).toBe("70");
  });

  it("网络失败不等于无汇率，并支持重新请求", async () => {
    mocks.fetchDaily
      .mockRejectedValueOnce(new Error("network offline"))
      .mockResolvedValueOnce({ rate: 23.8124, rateDate: "2026-11-20" });
    const { result } = renderHook(() =>
      useLinkExchangeRates("CNY", "2026-11-20", ["JPY"]),
    );
    await waitFor(() => expect(result.current.getStatus("JPY")).toBe("failed"));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.getStatus("JPY")).toBe("available"));
    expect(result.current.getRate("JPY")?.rate).toBe(23.8124);
  });
});
