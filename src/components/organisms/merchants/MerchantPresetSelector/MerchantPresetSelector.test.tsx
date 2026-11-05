import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toggleChecklistGroup } from "molecules/ui/GroupedPresetChecklist/groupedPresetChecklistTestUtils";
import { MerchantPresetSelectorExample } from "./merchantPresetSelectorTestUtils";

function expand(name: string, index = 0) {
  return within(toggleChecklistGroup(name, index));
}

describe("MerchantPresetSelector", () => {
  it("默认8类全部收起，勾选分类不会展开", () => {
    render(<MerchantPresetSelectorExample />);
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(8);
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
  it("追加中国另起一组，共用商家不重复，新增地区全部不勾", () => {
    const changed = vi.fn();
    render(<MerchantPresetSelectorExample onChange={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "添加中国常用商家" }));
    expect(changed).not.toHaveBeenCalled();
    expand("餐饮");
    expand("餐饮", 1);
    expect(screen.getAllByRole("checkbox", { name: /星巴克/ })).toHaveLength(1);
    expect(screen.getByRole("checkbox", { name: /海底捞/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: /海底捞/ }));
    expect(changed.mock.lastCall?.[0]).toContain("haidilao");
    expect(changed.mock.lastCall?.[0]).toContain("starbucks");
  });
  it("收起追加组保留勾选，再次展开恢复选择且共用商家不重复", () => {
    const changed = vi.fn();
    render(<MerchantPresetSelectorExample onChange={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "添加中国常用商家" }));
    expect(
      screen.getByRole("heading", { name: "🇨🇳 中国常用商家" }),
    ).toBeInTheDocument();
    expand("餐饮", 1);
    fireEvent.click(screen.getByRole("checkbox", { name: /海底捞/ }));
    const keys = changed.mock.lastCall?.[0];
    fireEvent.click(screen.getByRole("button", { name: "收起" }));
    expect(
      screen.queryByRole("heading", { name: "🇨🇳 中国常用商家" }),
    ).not.toBeInTheDocument();
    expect(changed.mock.lastCall?.[0]).toEqual(keys);
    fireEvent.click(screen.getByRole("button", { name: "添加中国常用商家" }));
    expand("餐饮", 1);
    expect(screen.getByRole("checkbox", { name: /海底捞/ })).toBeChecked();
    expand("餐饮");
    expect(screen.getAllByRole("checkbox", { name: /星巴克/ })).toHaveLength(1);
  });
  it("更改主要地区保留原选择并显示原地区追加组", () => {
    render(<MerchantPresetSelectorExample initialSelectedKeys={["aeon"]} />);
    fireEvent.click(screen.getByRole("button", { name: "更改" }));
    fireEvent.click(screen.getByRole("radio", { name: "中国" }));
    expect(screen.getByText("按中国常用商家推荐")).toBeInTheDocument();
    const japan = expand("超市", 1);
    expect(japan.getByRole("checkbox", { name: /永旺/ })).toBeChecked();
  });
});
