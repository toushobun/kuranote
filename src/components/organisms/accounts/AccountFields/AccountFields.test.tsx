import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AccountFields } from "./AccountFields";

afterEach(() => {
  cleanup();
});

const holderOptions = [
  {
    user_id: "00000000-0000-4000-8000-000000000001",
    display_name: "测试用户",
    email: "test@example.com",
  },
];

describe("AccountFields", () => {
  it("显示共用字段、类型占位和持有人布局", () => {
    render(
      <AccountFields
        balanceLabel="初始金额"
        defaultCurrency="CAD"
        defaultType=""
        holderOptions={holderOptions}
        nameId="account-name"
        namePlaceholder="例如：钱包现金"
        renderBalanceField={(currency) => (
          <div data-testid="balance-currency">{currency}</div>
        )}
        typePlaceholder="选择账户类型"
      />,
    );

    expect(screen.getByLabelText("账户名称")).toHaveAttribute(
      "placeholder",
      "例如：钱包现金",
    );
    expect(screen.getByText("选择账户类型")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "货币" })).toHaveTextContent(
      "CAD",
    );
    expect(screen.getByText("测试用户")).toBeInTheDocument();
    expect(screen.getByTestId("balance-currency")).toHaveTextContent("CAD");
  });

  it("切换货币时同步更新余额字段", () => {
    render(
      <AccountFields
        balanceLabel="当前余额"
        defaultCurrency="JPY"
        defaultName="现金账户"
        defaultType="cash"
        holderOptions={[]}
        nameId="account-name"
        renderBalanceField={(currency) => (
          <div data-testid="balance-currency">{currency}</div>
        )}
      />,
    );

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "货币" }));
    fireEvent.click(screen.getByRole("option", { name: "USD 美元" }));

    expect(screen.getByTestId("balance-currency")).toHaveTextContent("USD");
  });
});
