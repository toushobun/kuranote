import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MerchantStateAction } from "types/merchants";

import { MerchantCreateTemplate } from "./MerchantCreate";

describe("MerchantCreateTemplate", () => {
  it("显示与列表页一致的新增页标题、面包屑与返回入口", () => {
    render(
      <MerchantCreateTemplate
        createMerchantAction={vi.fn(async () => ({}))}
        fetchIconAction={vi.fn(async () => ({}))}
        ledgerId="ledger-1"
        ledgerName="家庭账本"
        tags={[]}
      />,
    );

    const heading = screen.getByRole("heading", { name: "新增商家" });
    const breadcrumb = screen.getByText(/新增商家 · 家庭账本/);
    const backLink = screen.getByRole("link", { name: "返回商家管理" });

    expect(heading).toHaveClass("MuiTypography-h5");
    expect(getComputedStyle(heading).fontWeight).toBe("900");
    expect(breadcrumb).toHaveClass("MuiTypography-body2");
    expect(backLink).toHaveAttribute("href", "/merchants");
    expect(getComputedStyle(backLink).borderTopStyle).toBe("solid");
    expect(getComputedStyle(backLink).boxShadow).toContain("14px");
  });

  it("提交新增商家表单", async () => {
    const createMerchantAction = vi.fn<MerchantStateAction>(async () => ({}));
    render(
      <MerchantCreateTemplate
        createMerchantAction={createMerchantAction}
        fetchIconAction={vi.fn(async () => ({}))}
        ledgerId="ledger-1"
        ledgerName="家庭账本"
        tags={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "Amazon" },
    });
    fireEvent.change(screen.getByLabelText("商家网址"), {
      target: { value: "https://www.amazon.co.jp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存商家" }));

    await waitFor(() => expect(createMerchantAction).toHaveBeenCalledOnce());
    const formData = createMerchantAction.mock.calls[0]?.[1];
    expect(formData?.get("name")).toBe("Amazon");
    expect(formData?.get("websiteUrl")).toBe("https://www.amazon.co.jp");
  });
});
