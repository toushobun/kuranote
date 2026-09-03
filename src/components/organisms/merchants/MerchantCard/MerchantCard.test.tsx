import { cleanup, render, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, describe, expect, it } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { theme } from "theme/theme";

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
    expect(
      container.querySelector('img[src="/assets/kura-icons/merchant.png"]'),
    ).toBeInTheDocument();
  });

  it("直接使用数据库中缓存的图标地址", () => {
    const { container } = render(
      <MerchantCard
        editHref="/merchants/merchant-1/edit"
        ledgerId="ledger-1"
        merchant={createMerchantRow({
          icon_url: "https://t2.gstatic.com/faviconV2?url=https://example.com",
        })}
      />,
    );

    expect(container.querySelector(".MerchantAvatar-image")).toHaveAttribute(
      "src",
      "https://t2.gstatic.com/faviconV2?url=https://example.com",
    );
    expect(container.innerHTML).not.toContain("/merchants/icon?");
  });

  it("首选别名与正式名相同时仍显示正式名说明", () => {
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

    expect(within(container).getByText("正式名：LIFE超市")).toBeInTheDocument();
  });

  it("标签第一项显示真实首选名，后面再显示其他别名", () => {
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
    const secondaryChip = chips[1]?.closest(".MuiChip-root");

    expect(chips.map((chip) => chip.textContent)).toEqual(["来福", "Life"]);
    expect(preferredChip).toHaveClass("MuiChip-filled");
    expect(getComputedStyle(preferredChip as Element).color).toBe(
      "rgb(255, 255, 255)",
    );
    expect(
      getComputedStyle(preferredChip?.querySelector("svg") as Element).color,
    ).toBe("rgb(255, 255, 255)");
    expect(getComputedStyle(preferredChip as Element).fontWeight).toBe(
      getComputedStyle(secondaryChip as Element).fontWeight,
    );
    expect(secondaryChip).toHaveClass("MuiChip-outlined");
  });

  it("没有首选别名时显示名使用普通标签", () => {
    const merchant = createMerchantRow({
      aliases: [
        createMerchantAliasRow({
          alias: "Life",
          id: "alias-secondary",
          is_preferred: false,
        }),
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

    const chips = Array.from(container.querySelectorAll(".MuiChip-label"));
    const displayNameChip = chips[0]?.closest(".MuiChip-root");

    expect(chips.map((chip) => chip.textContent)).toEqual(["LIFE超市", "Life"]);
    expect(displayNameChip).toHaveClass("MuiChip-outlined");
    expect(displayNameChip?.querySelector("svg")).toBeNull();
  });

  it("分类标签按设计稿分离图标与名称，并使用柔和彩色方圆角", () => {
    const merchant = createMerchantRow({
      tags: [
        {
          icon: "🛒",
          id: "tag-supermarket",
          merchant_count: 3,
          name: "超市",
          sort_order: 0,
        },
        {
          icon: "🏪",
          id: "tag-convenience",
          merchant_count: 2,
          name: "便利店",
          sort_order: 1,
        },
      ],
    });
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MerchantCard
          editHref="/merchants/merchant-1/edit"
          ledgerId="ledger-1"
          merchant={merchant}
        />
      </ThemeProvider>,
    );

    const supermarketLabel = within(container).getByText("超市");
    const convenienceLabel = within(container).getByText("便利店");
    const supermarketChip = supermarketLabel.closest(".MuiChip-root");
    const convenienceChip = convenienceLabel.closest(".MuiChip-root");

    expect(supermarketChip?.querySelector(".MuiChip-icon")).toHaveTextContent(
      "🛒",
    );
    expect(convenienceChip?.querySelector(".MuiChip-icon")).toHaveTextContent(
      "🏪",
    );
    expect(getComputedStyle(supermarketChip as Element).borderRadius).toBe(
      "8px",
    );
    expect(getComputedStyle(supermarketChip as Element).backgroundColor).toBe(
      "rgb(239, 249, 214)",
    );
    expect(getComputedStyle(convenienceChip as Element).backgroundColor).toBe(
      "rgb(232, 244, 255)",
    );
  });
});
