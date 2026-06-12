import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionAmountKeypad } from "./TransactionAmountKeypad";

afterEach(() => {
  cleanup();
});

describe("TransactionAmountKeypad", () => {
  it("可以通过数字键和确认键回填金额", () => {
    const handleChange = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <TransactionAmountKeypad
        value=""
        onChange={handleChange}
        onConfirm={handleConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "确认" }));

    expect(handleChange).toHaveBeenLastCalledWith("12");
    expect(handleConfirm).toHaveBeenCalledWith("12");
  });

  it("支持简单加法和减法", () => {
    const handleConfirm = vi.fn();

    render(
      <TransactionAmountKeypad
        value=""
        onChange={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "加" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "减" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "确认" }));

    expect(handleConfirm).toHaveBeenCalledWith("12");
  });

  it("JPY 场景下小数点按钮不可用", () => {
    render(
      <TransactionAmountKeypad
        currency="JPY"
        value=""
        onChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "." })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("确认非法金额时显示错误，不回填", () => {
    const handleConfirm = vi.fn();

    render(
      <TransactionAmountKeypad
        value=""
        onChange={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "确认" }));

    expect(screen.getByText("请输入有效金额。")).toBeTruthy();
    expect(handleConfirm).not.toHaveBeenCalled();
  });
});
