import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toggleChecklistGroup } from "molecules/ui/GroupedPresetChecklist/groupedPresetChecklistTestUtils";
import {
  merchantRegionButtonName,
  MerchantPresetSelectorExample,
} from "./merchantPresetSelectorTestUtils";

function expand(name: string, index = 0) {
  return within(toggleChecklistGroup(name, index));
}

describe("MerchantPresetSelector", () => {
  it("默认7类全部收起，勾选分类不会展开", () => {
    render(<MerchantPresetSelectorExample />);
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(8);
    expect(
      screen.queryByRole("checkbox", { name: /苹果/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "选择「购物·订阅」的全部商家" }),
    );
    expect(screen.getByRole("button", { name: "购物·订阅" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
  it("商家显示头像、中文名与单行别名，不显示网址；跨分类联动并提示也在", () => {
    const changed = vi.fn();
    render(<MerchantPresetSelectorExample onChange={changed} />);
    const shopping = expand("购物·订阅");
    const living = expand("生活缴费");
    expect(shopping.getByText("乐天")).toBeInTheDocument();
    expect(shopping.getByText(/楽天 ·/)).toBeInTheDocument();
    expect(shopping.getByText("也在：生活缴费")).toBeInTheDocument();
    expect(living.getByText("也在：购物·订阅")).toBeInTheDocument();
    expect(screen.queryByText(/rakuten.co.jp/)).not.toBeInTheDocument();
    fireEvent.click(shopping.getByRole("checkbox", { name: /乐天/ }));
    expect(living.getByRole("checkbox", { name: /乐天/ })).not.toBeChecked();
    expect(
      shopping.getByRole("checkbox", { name: "选择「购物·订阅」的全部商家" }),
    ).toHaveAttribute("data-indeterminate", "true");
    expect(changed.mock.lastCall?.[0]).not.toContain("rakuten");
  });
  it("三态整类选择按唯一商家操作", () => {
    const changed = vi.fn();
    render(
      <MerchantPresetSelectorExample
        initialSelectedKeys={["apple"]}
        onChange={changed}
      />,
    );
    const box = screen.getByRole("checkbox", {
      name: "选择「购物·订阅」的全部商家",
    });
    expect(box).toHaveAttribute("data-indeterminate", "true");
    fireEvent.click(box);
    expect(box).toBeChecked();
    expect(new Set(changed.mock.lastCall?.[0]).size).toBe(
      changed.mock.lastCall?.[0].length,
    );
    fireEvent.click(box);
    expect(box).not.toBeChecked();
    expect(changed.mock.lastCall?.[0]).toEqual([]);
  });
  it.each([
    ["jp", "cn"],
    ["cn", "jp"],
  ] as const)(
    "生活地区 %s 在前且默认展开，两组都能折叠",
    (primary, secondary) => {
      render(<MerchantPresetSelectorExample initialRegion={primary} />);
      const primaryButton = screen.getByRole(
        "button",
        merchantRegionButtonName(primary),
      );
      const secondaryButton = screen.getByRole(
        "button",
        merchantRegionButtonName(secondary),
      );
      expect(
        screen
          .getAllByRole("heading", { level: 4 })
          .map((heading) => within(heading).getByRole("button")),
      ).toEqual([primaryButton, secondaryButton]);
      expect(primaryButton).toHaveAttribute("aria-expanded", "true");
      expect(secondaryButton).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(primaryButton);
      expect(primaryButton).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(secondaryButton);
      expect(secondaryButton).toHaveAttribute("aria-expanded", "true");
    },
  );

  it("展开只浏览，首次勾选才登记地区，收起时保留唯一计数", async () => {
    const changed = vi.fn();
    const added = vi.fn();
    render(
      <MerchantPresetSelectorExample
        onChange={changed}
        onAdditionalRegionsChange={added}
      />,
    );
    const regionButton = screen.getByRole(
      "button",
      merchantRegionButtonName("cn"),
    );
    fireEvent.click(regionButton);
    expect(added).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
    expand("餐饮");
    const secondary = expand("餐饮", 1);
    const merchant = secondary.getByRole("checkbox", { name: /海底捞/ });
    expect(merchant).not.toBeChecked();
    expect(screen.getAllByRole("checkbox", { name: /星巴克/ })).toHaveLength(1);
    fireEvent.click(merchant);
    expect(added).toHaveBeenCalledExactlyOnceWith(["cn"]);
    expect(changed.mock.lastCall?.[0]).toEqual(
      expect.arrayContaining(["haidilao", "starbucks"]),
    );
    fireEvent.click(regionButton);
    expect(regionButton).toHaveTextContent("已选 1 家");
    expect(regionButton).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(merchant).not.toBeVisible());
    fireEvent.click(regionButton);
    expect(
      expand("餐饮", 1).getByRole("checkbox", { name: /海底捞/ }),
    ).toBeChecked();
  });

  it("恢复有已选商家的第二地区并显示已选数量", () => {
    render(
      <MerchantPresetSelectorExample
        initialAdditionalRegions={["cn"]}
        initialSelectedKeys={["haidilao"]}
      />,
    );
    expect(
      screen.getByRole("button", {
        ...merchantRegionButtonName("cn"),
        description: "已选 1 家",
      }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      expand("餐饮", 1).getByRole("checkbox", { name: /海底捞/ }),
    ).toBeChecked();
  });
});
