import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toggleChecklistGroup } from "molecules/ui/GroupedPresetChecklist/groupedPresetChecklistTestUtils";
import { MerchantPresetSelectorExample } from "./merchantPresetSelectorTestUtils";

function expand(name: string, index = 0) {
  return within(toggleChecklistGroup(name, index));
}

describe("MerchantPresetSelector", () => {
  it("默认8类全部收起，勾选分类不会展开", () => {
    render(<MerchantPresetSelectorExample />);
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(9);
    expect(
      screen.queryByRole("checkbox", { name: /苹果/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "选择「购物」的全部商家" }),
    );
    expect(screen.getByRole("button", { name: "购物" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
  it("商家显示头像、中文名与单行别名，不显示网址；跨分类联动并提示也在", () => {
    const changed = vi.fn();
    render(<MerchantPresetSelectorExample onChange={changed} />);
    const shopping = expand("购物");
    const online = expand("网购·订阅");
    expect(shopping.getByText("苹果")).toBeInTheDocument();
    expect(shopping.getByText(/Apple ·/)).toBeInTheDocument();
    expect(shopping.getByText("也在：网购·订阅")).toBeInTheDocument();
    expect(online.getByText("也在：购物")).toBeInTheDocument();
    expect(screen.queryByText(/apple.com/)).not.toBeInTheDocument();
    fireEvent.click(shopping.getByRole("checkbox", { name: /苹果/ }));
    expect(online.getByRole("checkbox", { name: /苹果/ })).not.toBeChecked();
    expect(
      shopping.getByRole("checkbox", { name: "选择「购物」的全部商家" }),
    ).toHaveAttribute("data-indeterminate", "true");
    expect(changed.mock.lastCall?.[0]).not.toContain("apple");
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
      name: "选择「购物」的全部商家",
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
    ["jp", "日本", "中国"],
    ["cn", "中国", "日本"],
  ] as const)("按生活地区排序：%s", (region, primary, secondary) => {
    render(<MerchantPresetSelectorExample initialRegion={region} />);
    expect(
      screen
        .getAllByRole("heading", { level: 4 })
        .map((node) => node.textContent),
    ).toEqual([`${primary}常用商家`, `${secondary}常用商家已选 0 家`]);
    expect(
      screen.getByRole("button", { name: new RegExp(secondary) }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("展开只浏览，首次勾选才登记地区，收起时保留唯一计数", async () => {
    const changed = vi.fn();
    const added = vi.fn();
    render(
      <MerchantPresetSelectorExample
        onChange={changed}
        onAdditionalRegionsChange={added}
      />,
    );
    const regionButton = screen.getByRole("button", { name: /中国常用商家/ });
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
    await waitFor(() => expect(merchant).not.toBeInTheDocument());
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
      screen.getByRole("button", { name: /中国常用商家.*已选 1 家/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      expand("餐饮", 1).getByRole("checkbox", { name: /海底捞/ }),
    ).toBeChecked();
  });
});
