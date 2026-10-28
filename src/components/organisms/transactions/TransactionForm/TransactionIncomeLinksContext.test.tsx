import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  TransactionIncomeLinksProvider,
  useResolvedTransactionIncomeLinks,
} from "./TransactionIncomeLinksContext";

describe("useResolvedTransactionIncomeLinks", () => {
  it("没有 Provider 时使用调用方传入的值", () => {
    const loadRefundSearchPageAction = vi.fn();
    const { result } = renderHook(() =>
      useResolvedTransactionIncomeLinks({ loadRefundSearchPageAction }),
    );

    expect(result.current.loadRefundSearchPageAction).toBe(
      loadRefundSearchPageAction,
    );
    expect(result.current.refundPickerView).toBeUndefined();
  });

  it("有 Provider 时优先使用 Provider，缺少的项回退到传入值", () => {
    const providerAction = vi.fn();
    const fallbackAction = vi.fn();
    const fallbackReimbursementAction = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TransactionIncomeLinksProvider
        value={{ loadRefundSearchPageAction: providerAction }}
      >
        {children}
      </TransactionIncomeLinksProvider>
    );
    const { result } = renderHook(
      () =>
        useResolvedTransactionIncomeLinks({
          loadRefundSearchPageAction: fallbackAction,
          loadReimbursementSearchPageAction: fallbackReimbursementAction,
        }),
      { wrapper },
    );

    expect(result.current.loadRefundSearchPageAction).toBe(providerAction);
    expect(result.current.loadReimbursementSearchPageAction).toBe(
      fallbackReimbursementAction,
    );
  });
});
