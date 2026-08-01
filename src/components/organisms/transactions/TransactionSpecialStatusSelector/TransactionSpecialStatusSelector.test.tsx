import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionSpecialStatusSelector } from "./TransactionSpecialStatusSelector";

describe("TransactionSpecialStatusSelector", () => {
  it("显示固定状态并允许选择和清空", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TransactionSpecialStatusSelector onChange={onChange} value={null} />,
    );

    expect(screen.getByRole("radio", { name: /无特殊状态/ })).toBeChecked();
    expect(screen.getByText("待报销")).toBeInTheDocument();
    expect(screen.getByText("不计入支出")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /待退款/ }));
    expect(onChange).toHaveBeenCalledWith("pendingRefund");

    rerender(
      <TransactionSpecialStatusSelector
        onChange={onChange}
        value="pendingRefund"
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /无特殊状态/ }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("加载时不显示选择项", () => {
    render(
      <TransactionSpecialStatusSelector
        onChange={vi.fn()}
        state="loading"
        value={null}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("正在加载特殊状态");
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("错误时显示反馈并允许重试", () => {
    const onRetry = vi.fn();
    render(
      <TransactionSpecialStatusSelector
        onChange={vi.fn()}
        onRetry={onRetry}
        state="error"
        value={null}
      />,
    );

    expect(screen.getByText(/特殊状态加载失败/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
