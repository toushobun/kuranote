import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MerchantForm } from "./MerchantForm";

afterEach(cleanup);

describe("MerchantForm", () => {
  it("编辑新增商家的各字段", () => {
    render(<MerchantForm action={vi.fn()} ledgerId="ledger-1" />);

    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "Amazon" },
    });
    fireEvent.change(screen.getByLabelText("商家网址"), {
      target: { value: "https://www.amazon.co.jp" },
    });
    fireEvent.change(screen.getByLabelText("备注（可选）"), {
      target: { value: "网购" },
    });

    expect(screen.getByLabelText(/商家名称/)).toHaveValue("Amazon");
    expect(screen.getByLabelText("商家网址")).toHaveValue(
      "https://www.amazon.co.jp",
    );
    expect(screen.getByLabelText("备注（可选）")).toHaveValue("网购");
  });

  it("提交中禁用按钮并显示进度", () => {
    render(<MerchantForm action={vi.fn()} ledgerId="ledger-1" pending />);

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByLabelText("新增中")).toBeInTheDocument();
  });
});
