import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionReimbursementLinkPicker } from "./TransactionReimbursementLinkPicker";

const candidate = {
  accountCurrency: "JPY",
  amount: "1200",
  categoryName: "交通费",
  id: "00000000-0000-4000-8000-000000000001",
  transactionAt: "2026-08-01T00:00:00.000Z",
};

describe("TransactionReimbursementLinkPicker", () => {
  it("展开后多选待报销明细", () => {
    const onChange = vi.fn();
    render(
      <TransactionReimbursementLinkPicker
        candidates={[candidate]}
        onChange={onChange}
        selectedIds={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "报销关联" }));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith([candidate.id]);
  });

  it("没有候选时显示引导文案", () => {
    render(
      <TransactionReimbursementLinkPicker
        candidates={[]}
        onChange={vi.fn()}
        selectedIds={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "报销关联" }));
    expect(screen.getByText("当前账本没有待报销明细。")).toBeInTheDocument();
  });
});
