import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountForm } from "./AccountForm";

afterEach(() => {
  cleanup();
});

const baseProps = {
  createAccountAction: vi.fn(async () => {}),
  defaultCurrency: "JPY",
  holderOptions: [],
};

describe("AccountForm", () => {
  it("显示新增账户标题和字段", () => {
    const { container } = render(<AccountForm {...baseProps} />);

    expect(
      within(container).getByRole("heading", { name: "新增账户" }),
    ).toBeInTheDocument();
    expect(within(container).getByLabelText("账户名称")).toBeInTheDocument();
    expect(within(container).getByLabelText("初始余额")).toBeInTheDocument();
    expect(
      within(container).getByPlaceholderText("例如：钱包现金"),
    ).toBeInTheDocument();
    expect(within(container).getByText("选择账户类型")).toBeInTheDocument();
    expect(within(container).getByText("JPY 日元")).toBeInTheDocument();
  });

  it("显示插图预留位", () => {
    const { container } = render(
      <AccountForm
        {...baseProps}
        illustrationSlot={<div data-testid="illustration-slot" />}
      />,
    );

    expect(
      within(container).getByTestId("illustration-slot"),
    ).toBeInTheDocument();
  });

  it("传入取消回调时显示取消按钮", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <AccountForm {...baseProps} onCancel={onCancel} />,
    );

    expect(
      within(container).getByRole("button", { name: "取消" }),
    ).toBeInTheDocument();
  });
});
