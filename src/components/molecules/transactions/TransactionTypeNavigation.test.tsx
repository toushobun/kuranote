import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionTypeNavigation } from "./TransactionTypeNavigation";

afterEach(() => {
  cleanup();
});

describe("TransactionTypeNavigation", () => {
  it("默认渲染收支和转账入口", () => {
    render(
      <TransactionTypeNavigation activeType="normal" onChange={() => {}} />,
    );

    expect(screen.getByRole("button", { name: "收支" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "转账" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "支出" })).toBeNull();
    expect(screen.queryByRole("button", { name: "收入" })).toBeNull();
  });

  it("当前类型高亮", () => {
    render(
      <TransactionTypeNavigation activeType="normal" onChange={() => {}} />,
    );

    expect(screen.getByRole("button", { name: "收支" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "转账" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("点击转账会触发切换", () => {
    const onChange = vi.fn();
    render(
      <TransactionTypeNavigation activeType="normal" onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "转账" }));

    expect(onChange).toHaveBeenCalledWith("transfer");
  });

  it("点击收支会触发切换", () => {
    const onChange = vi.fn();
    render(
      <TransactionTypeNavigation activeType="transfer" onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "收支" }));

    expect(onChange).toHaveBeenCalledWith("normal");
  });
});
