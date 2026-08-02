import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionPendingReimbursementCheckbox } from "./TransactionPendingReimbursementCheckbox";

describe("TransactionPendingReimbursementCheckbox", () => {
  it("切换待报销勾选状态", () => {
    const onChange = vi.fn();
    render(
      <TransactionPendingReimbursementCheckbox
        checked={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "待报销" }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("正确展示已勾选状态", () => {
    render(
      <TransactionPendingReimbursementCheckbox checked onChange={vi.fn()} />,
    );

    expect(screen.getByRole("checkbox", { name: "待报销" })).toBeChecked();
  });
});
