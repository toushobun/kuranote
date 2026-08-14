import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransactionOriginalAmount } from "./TransactionOriginalAmount";

describe("TransactionOriginalAmount", () => {
  it("弱化显示原金额", () => {
    render(<TransactionOriginalAmount amount="- ¥ 500" />);

    expect(screen.getByText("原金额 - ¥ 500")).toHaveStyle({
      color: "rgba(0, 0, 0, 0.38)",
      fontWeight: "400",
    });
  });

  it("支持行内括号形式", () => {
    render(<TransactionOriginalAmount amount="- ¥ 500" parenthesized />);

    expect(screen.getByText("（原金额 - ¥ 500）")).toBeInTheDocument();
  });
});
