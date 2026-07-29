import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  TransactionSelectionValue,
  transactionSelectionSelectSx,
} from "./TransactionSelectionValue";

describe("TransactionSelectionValue", () => {
  it("显示选择项文字和带说明的图标", () => {
    render(
      <TransactionSelectionValue
        icon={<AccountBalanceWalletRoundedIcon />}
        iconLabel="账户"
        text="现金账户"
        tone="account"
      />,
    );

    expect(screen.getByText("现金账户")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "账户" })).toBeInTheDocument();
  });

  it("未提供图标说明时将装饰图标隐藏于无障碍树", () => {
    render(
      <TransactionSelectionValue
        icon={<AccountBalanceWalletRoundedIcon />}
        text="未指定账户"
        tone="outgoing"
      />,
    );

    expect(screen.getByText("未指定账户")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("导出选择器共用样式", () => {
    expect(transactionSelectionSelectSx).toMatchObject({
      "& .MuiInputLabel-root": expect.any(Object),
      "& .MuiOutlinedInput-root": expect.objectContaining({ minHeight: 50 }),
      "& .MuiSelect-select": expect.any(Object),
    });
  });
});
