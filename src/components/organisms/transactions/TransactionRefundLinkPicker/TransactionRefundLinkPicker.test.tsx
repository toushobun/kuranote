import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransactionRefundLinkPicker } from "./TransactionRefundLinkPicker";

describe("TransactionRefundLinkPicker", () => {
  it("打开复用的按月浏览与搜索选择模式", () => {
    render(<TransactionRefundLinkPicker onChange={vi.fn()} value={null} />);
    fireEvent.click(screen.getByRole("button", { name: "选择退款明细" }));
    expect(screen.getByRole("tab", { name: "按月浏览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "搜索" })).toBeInTheDocument();
  });
});
