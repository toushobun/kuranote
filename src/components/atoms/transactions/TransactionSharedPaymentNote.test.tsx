import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransactionSharedPaymentNote } from "./TransactionSharedPaymentNote";

describe("TransactionSharedPaymentNote", () => {
  it("用中性色右对齐显示共同支付文案", () => {
    render(<TransactionSharedPaymentNote label="共同支付 · 整笔 ¥120,000" />);

    expect(screen.getByText("共同支付 · 整笔 ¥120,000")).toHaveStyle({
      color: "rgba(0, 0, 0, 0.6)",
      textAlign: "right",
    });
  });
});
