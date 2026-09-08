import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { createDynamicMuiTheme } from "providers/DynamicMuiThemeProvider";
import { theme } from "theme/theme";
import { userThemeKeys, userThemeTokens } from "theme/userThemeTokens";

import { MerchantCard } from "./MerchantCard";

afterEach(cleanup);

function toComputedColor(color: string) {
  if (color === "#fff") {
    return "rgb(255, 255, 255)";
  }

  return color;
}

describe("MerchantCard", () => {
  it("标题固定显示正式名并提供独立编辑页入口", () => {
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
      within(container).getByRole("heading", { name: "LIFE超市" }),
    ).toBeInTheDocument();
    expect(
      within(container).queryByRole("heading", { name: "来福" }),
    ).not.toBeInTheDocument();
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

  it("正式名固定居首并加粗，星标仅跟随首选别名", () => {
    const action = vi.fn<(formData: FormData) => Promise<void>>(async () => {});
    const { container } = render(
      <MerchantCard
        editHref="/edit"
        ledgerId="ledger-1"
        merchant={createMerchantRow({
          aliases: [
            createMerchantAliasRow({ is_preferred: true }),
            createMerchantAliasRow({ id: "alias-2", alias: "LIFE" }),
          ],
          display_name: "来福",
        })}
        setPreferredAliasAction={action}
      />,
    );
    const options = within(container).getAllByRole("button");
    expect(options.map((option) => option.getAttribute("aria-label"))).toEqual([
      "将LIFE超市设为展示名",
      "来福是当前展示名",
      "将LIFE设为展示名",
    ]);
    expect(
      getComputedStyle(within(options[0]).getByText("LIFE超市")).fontWeight,
    ).toBe("700");
    expect(within(options[0]).queryByText("正式名")).not.toBeInTheDocument();
    expect(options[0]).toHaveAttribute("aria-pressed", "false");
    expect(options[0].querySelector("svg")).toBeNull();
    expect(options[1]).toHaveAttribute("aria-pressed", "true");
    expect(
      within(options[1]).getByTestId("StarRoundedIcon"),
    ).toBeInTheDocument();
    fireEvent.click(within(options[0]).getByText("LIFE超市"));
    expect(action).toHaveBeenCalledOnce();
    const data = action.mock.calls[0][0] as FormData;
    expect(data.get("merchantId")).toBe(createMerchantRow().id);
    expect(data.get("aliasId")).toBe("");
  });

  it("未选别名时正式名保持加粗并带星标和选中背景", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MerchantCard
          editHref="/edit"
          ledgerId="ledger-1"
          merchant={createMerchantRow()}
          setPreferredAliasAction={async () => {}}
        />
      </ThemeProvider>,
    );
    const option = within(container).getByRole("button", {
      name: "LIFE超市是当前展示名",
    });
    expect(
      getComputedStyle(within(option).getByText("LIFE超市")).fontWeight,
    ).toBe("700");
    expect(within(option).queryByText("正式名")).not.toBeInTheDocument();
    expect(within(option).getByTestId("StarRoundedIcon")).toBeInTheDocument();
    expect(option).toHaveAttribute("aria-pressed", "true");
    expect(getComputedStyle(option).backgroundColor).not.toBe("transparent");
  });

  it("同名别名仍按身份区分选中状态", () => {
    const { container } = render(
      <MerchantCard
        editHref="/edit"
        ledgerId="ledger-1"
        merchant={createMerchantRow({
          aliases: [
            createMerchantAliasRow({ alias: "LIFE超市", is_preferred: true }),
          ],
        })}
        setPreferredAliasAction={async () => {}}
      />,
    );
    expect(
      within(container).getByRole("button", { name: "将LIFE超市设为展示名" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(container).getByRole("button", { name: "LIFE超市是当前展示名" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("只读成员不能提交显示名切换", () => {
    const action = vi.fn<(formData: FormData) => Promise<void>>(async () => {});
    const { container } = render(
      <MerchantCard
        canManageMerchants={false}
        editHref="/edit"
        ledgerId="ledger-1"
        merchant={createMerchantRow()}
        setPreferredAliasAction={action}
      />,
    );
    const option = within(container).getByRole("button", {
      name: "LIFE超市是当前展示名",
    });
    expect(option).toBeDisabled();
    fireEvent.click(option);
    expect(action).not.toHaveBeenCalled();
  });

  it("全部用户主题下选中名称保持主题对比文字色", () => {
    userThemeKeys.forEach((themeKey) => {
      const dynamicTheme = createDynamicMuiTheme(themeKey);
      const { container, unmount } = render(
        <ThemeProvider theme={dynamicTheme}>
          <MerchantCard
            editHref="/edit"
            ledgerId="ledger-1"
            merchant={createMerchantRow()}
            setPreferredAliasAction={async () => {}}
          />
        </ThemeProvider>,
      );
      const option = within(container).getByRole("button", {
        name: "LIFE超市是当前展示名",
      });
      expect(dynamicTheme.palette.primary.main).toBe(
        userThemeTokens[themeKey].palette.accent,
      );
      expect(getComputedStyle(option).color).toBe(
        toComputedColor(dynamicTheme.palette.primary.contrastText),
      );
      unmount();
    });
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
    const divider = within(container).getByRole("separator");
    const card = divider.parentElement;
    const tagRow = convenienceChip?.parentElement;
    const supermarketIcon = supermarketChip?.querySelector(".MuiChip-icon");
    const supermarketChipLabel =
      supermarketChip?.querySelector(".MuiChip-label");

    expect(supermarketChip?.querySelector(".MuiChip-icon")).toHaveTextContent(
      "🛒",
    );
    expect(convenienceChip?.querySelector(".MuiChip-icon")).toHaveTextContent(
      "🏪",
    );
    expect(getComputedStyle(supermarketChip as Element).borderRadius).toBe(
      "8px",
    );
    expect(getComputedStyle(supermarketChip as Element).height).toBe("28px");
    expect(getComputedStyle(supermarketIcon as Element).marginRight).toBe(
      "4px",
    );
    expect(getComputedStyle(supermarketChipLabel as Element).paddingRight).toBe(
      "10px",
    );
    expect(getComputedStyle(supermarketChip as Element).backgroundColor).toBe(
      "rgb(239, 249, 214)",
    );
    expect(
      getComputedStyle(supermarketChip as Element).backgroundImage,
    ).toContain("data:image/svg+xml");
    expect(
      getComputedStyle(supermarketChip as Element).backgroundImage,
    ).toContain("M6%200L12%206L6%2012L0%206Z");
    expect(
      getComputedStyle(supermarketChip as Element).backgroundImage,
    ).toContain("%200.02");
    expect(getComputedStyle(convenienceChip as Element).backgroundColor).toBe(
      "rgb(232, 244, 255)",
    );
    expect(getComputedStyle(divider).borderBottomStyle).toBe("dashed");
    expect(card?.children[1]).toBe(divider);
    expect(card?.children[2]).toBe(tagRow);
    expect(getComputedStyle(tagRow as Element).gap).toBe("12px");
    expect(getComputedStyle(tagRow as Element).paddingLeft).toBe("16px");
  });
});
