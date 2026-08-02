import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionSpecialStatusSelector } from "./TransactionSpecialStatusSelector";

describe("TransactionSpecialStatusSelector", () => {
  it("没有状态标签时默认折叠", () => {
    render(
      <TransactionSpecialStatusSelector onChange={vi.fn()} value={null} />,
    );

    expect(
      screen.getByRole("switch", { name: "启用状态标签" }),
    ).not.toBeChecked();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.queryByText("待报销")).toBeNull();
  });

  it("打开开关后展开并默认选择待报销", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TransactionSpecialStatusSelector onChange={onChange} value={null} />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "启用状态标签" }));
    expect(onChange).toHaveBeenCalledWith("pendingReimbursement");

    rerender(
      <TransactionSpecialStatusSelector
        onChange={onChange}
        value="pendingReimbursement"
      />,
    );

    expect(screen.getByRole("switch", { name: "启用状态标签" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByRole("radio", { name: /待报销/ })).toBeChecked();
  });

  it("关闭开关后收起并清空选择", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TransactionSpecialStatusSelector
        onChange={onChange}
        value="pendingRefund"
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "启用状态标签" }));
    expect(onChange).toHaveBeenCalledWith(null);

    rerender(
      <TransactionSpecialStatusSelector onChange={onChange} value={null} />,
    );
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("允许切换到其他状态标签", () => {
    const onChange = vi.fn();
    render(
      <TransactionSpecialStatusSelector
        onChange={onChange}
        value="pendingReimbursement"
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /待退款/ }));
    expect(onChange).toHaveBeenCalledWith("pendingRefund");
  });

  it("加载时不显示选择项", () => {
    render(
      <TransactionSpecialStatusSelector
        onChange={vi.fn()}
        state="loading"
        value={null}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("正在加载状态标签");
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

    expect(screen.getByText(/状态标签加载失败/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
