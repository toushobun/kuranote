import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MerchantsTemplate } from "./Merchants";

afterEach(() => {
  cleanup();
});

const baseProps = {
  archiveMerchantAction: vi.fn(async () => {}),
  archiveMerchantAliasAction: vi.fn(async () => {}),
  createMerchantAction: vi.fn(async () => {}),
  createMerchantAliasAction: vi.fn(async () => {}),
  merchants: [],
  keyword: "",
  ledgerName: "家庭账本",
  updateMerchantAction: vi.fn(async () => {}),
};

describe("MerchantsTemplate", () => {
  it("显示商家页面标题", () => {
    const { container } = render(<MerchantsTemplate {...baseProps} />);

    expect(
      within(container).getByRole("heading", { name: "商家" }),
    ).toBeInTheDocument();
  });

  it("显示当前账本名称", () => {
    const { container } = render(<MerchantsTemplate {...baseProps} />);

    expect(
      within(container).getByText("当前账本：家庭账本"),
    ).toBeInTheDocument();
  });

  it("显示搜索输入框", () => {
    const { container } = render(<MerchantsTemplate {...baseProps} />);

    expect(within(container).getByLabelText("搜索商家")).toBeInTheDocument();
  });

  it("有搜索词时输入框显示对应值", () => {
    const { container } = render(
      <MerchantsTemplate {...baseProps} keyword="便利" />,
    );

    const input = within(container).getByLabelText("搜索商家");

    expect((input as HTMLInputElement).value).toBe("便利");
  });
});
