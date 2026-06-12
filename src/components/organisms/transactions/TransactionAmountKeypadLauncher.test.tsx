import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TransactionAmountKeypadLauncher } from "./TransactionAmountKeypadLauncher";

afterEach(() => {
  cleanup();
});

describe("TransactionAmountKeypadLauncher", () => {
  it("金额输入框获得焦点后显示计算器并回填金额", () => {
    render(
      <form id="new-transaction-form">
        <input placeholder="0" type="text" defaultValue="" />
        <TransactionAmountKeypadLauncher />
      </form>,
    );

    const input = screen.getByRole("textbox");
    fireEvent.focusIn(input);

    expect(screen.getByText("金额输入")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "确认" }));

    expect(input).toHaveProperty("value", "12");
    expect(screen.queryByText("金额输入")).toBeNull();
  });

  it("不会响应非新增记账表单内的普通输入框", () => {
    render(
      <div>
        <input placeholder="0" type="text" />
        <TransactionAmountKeypadLauncher />
      </div>,
    );

    fireEvent.focusIn(screen.getByRole("textbox"));

    expect(screen.queryByText("金额输入")).toBeNull();
  });
});
