import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createMerchantRow } from "@/test/mocks/merchants";

import { MerchantEditForm } from "./MerchantEditForm";

afterEach(cleanup);

describe("MerchantEditForm", () => {
  it("显示并编辑既有商家信息", () => {
    const merchant = createMerchantRow({ note: "常去的超市" });
    const { container } = render(
      <MerchantEditForm
        action={vi.fn()}
        ledgerId="ledger-1"
        merchant={merchant}
      />,
    );

    expect(screen.getByLabelText(/商家名称/)).toHaveValue("LIFE超市");
    expect(screen.getByLabelText("备注（可选）")).toHaveValue("常去的超市");
    expect(container.querySelector('input[name="merchantId"]')).toHaveValue(
      merchant.id,
    );

    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "LIFE" },
    });
    expect(screen.getByLabelText(/商家名称/)).toHaveValue("LIFE");
  });

  it("保存中禁用按钮并显示进度", () => {
    const { container } = render(
      <MerchantEditForm
        action={vi.fn()}
        ledgerId="ledger-1"
        merchant={createMerchantRow()}
        pending
      />,
    );

    expect(container.querySelector('button[type="submit"]')).toBeDisabled();
    expect(screen.getByLabelText("保存中")).toBeInTheDocument();
  });
});
