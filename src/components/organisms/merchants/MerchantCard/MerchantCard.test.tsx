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
    expect(
      within(container).queryByText("正式名：LIFE超市"),
    ).not.toBeInTheDocument();
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
    expect(
      container.querySelector('img[src="/assets/kura-icons/merchant.png"]'),
    ).toBeInTheDocument();
  });

  it("首选别名与正式名相同时不重复显示正式名说明", () => {
    const merchant = createMerchantRow({
      aliases: [
        createMerchantAliasRow({ alias: "LIFE超市", is_preferred: true }),
      ],
      display_name: "LIFE超市",
      name: "LIFE超市",
    });
    const { container } = render(
      <MerchantCard
        editHref="/merchants/merchant-1/edit"
        ledgerId="ledger-1"
        merchant={merchant}
      />,
    );

    expect(
      within(container).queryByText("正式名：LIFE超市"),
    ).not.toBeInTheDocument();
  });

  it("标签第一项固定显示首选名，后面再显示其他别名", () => {
    const merchant = createMerchantRow({
      aliases: [
        createMerchantAliasRow({
          alias: "Life",
          id: "alias-secondary",
          is_preferred: false,
        }),
        createMerchantAliasRow({
          alias: "来福",
          id: "alias-preferred",
          is_preferred: true,
        }),
      ],
      display_name: "来福",
    });
    const { container } = render(
      <MerchantCard
        editHref="/merchants/merchant-1/edit"
        ledgerId="ledger-1"
        merchant={merchant}
      />,
    );

    const chips = Array.from(container.querySelectorAll(".MuiChip-label"));
    const preferredChip = chips[0]?.closest(".MuiChip-root");

    expect(chips.map((chip) => chip.textContent)).toEqual(["来福", "Life"]);
    expect(preferredChip).toHaveClass("MuiChip-filled");
    expect(getComputedStyle(preferredChip as Element).color).toBe(
      "rgb(255, 255, 255)",
    );
    expect(
      getComputedStyle(preferredChip?.querySelector("svg") as Element).color,
    ).toBe("rgb(255, 255, 255)");
    expect(chips[1]?.closest(".MuiChip-root")).toHaveClass("MuiChip-outlined");
  });
});
