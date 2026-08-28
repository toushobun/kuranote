import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantCard } from "./MerchantCard";

afterEach(cleanup);

describe("MerchantCard", () => {
  it("只显示商家信息并提供独立编辑页入口", () => {
    const merchant = createMerchantRow({
      aliases: [createMerchantAliasRow({ is_preferred: true })],
      display_name: "来福",
      note: "常去的超市",
    });
    const { container } = render(
      <MerchantCard
        editHref="/merchants/merchant-1/edit"
        ledgerId="ledger-1"
        merchant={merchant}
      />,
    );

    expect(
      within(container).getByRole("heading", { name: "来福" }),
    ).toBeInTheDocument();
    expect(within(container).getByText("正式名：LIFE超市")).toBeInTheDocument();
    expect(within(container).getByText("常去的超市")).toBeInTheDocument();
    expect(
      within(container).getByRole("link", { name: "编辑LIFE超市" }),
    ).toHaveAttribute("href", "/merchants/merchant-1/edit");
    expect(within(container).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("没有网址时显示安全占位提示", () => {
    const { container } = render(
      <MerchantCard
        editHref="/merchants/merchant-1/edit"
        ledgerId="ledger-1"
        merchant={createMerchantRow({ website_url: null })}
      />,
    );

    expect(within(container).getByText("网址未设置")).toBeInTheDocument();
  });
});
