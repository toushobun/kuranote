import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createEntryCallbacks,
  renderEntryComponent,
  clickEntryButton as click,
} from "test/transactionStepFlow";
import {
  flowFixture,
  merchantStepFixture,
} from "test/mocks/transactionStepFlow";
import { MerchantStep } from "./MerchantStep";
import type { MerchantStepProps } from "./MerchantStep.types";

function setup(overrides: Partial<MerchantStepProps> = {}) {
  const callbacks = createEntryCallbacks();
  const props = {
    ...merchantStepFixture,
    onSelect: callbacks.onMerchantSelect,
    onAddMerchant: callbacks.onAddMerchant,
    onAddPresets: callbacks.onAddPresets,
    ...overrides,
  };
  renderEntryComponent(<MerchantStep {...props} />);
  return props;
}
describe("MerchantStep", () => {
  it("常用商家按传入顺序排列，不足八个不补占位", () => {
    setup();
    const buttons = screen
      .getAllByRole("button")
      .filter((item) =>
        ["7-Eleven", "LIFE超市", "星巴克"].includes(item.textContent ?? ""),
      );
    expect(buttons.map((item) => item.textContent)).toEqual([
      "7-Eleven",
      "LIFE超市",
      "星巴克",
    ]);
  });

  it("分类筛选和搜索隐藏常用商家，只显示匹配列表", () => {
    setup();
    click("🍴 餐饮");
    expect(screen.queryByText("常用商家")).not.toBeInTheDocument();
    expect(screen.queryByText("LIFE超市")).not.toBeInTheDocument();
    click("全部");
    fireEvent.change(screen.getByRole("textbox", { name: "搜索商家" }), {
      target: { value: "life" },
    });
    expect(screen.queryByText("常用商家")).not.toBeInTheDocument();
    expect(screen.getByText("LIFE超市")).toBeInTheDocument();
    expect(screen.queryByText("星巴克")).not.toBeInTheDocument();
  });

  it("搜索不到时可通知外部新增指定商家", () => {
    const props = setup();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "星野咖啡" },
    });
    expect(screen.getByText("没有找到“星野咖啡”")).toBeInTheDocument();
    click("新增商家“星野咖啡”");
    expect(props.onAddMerchant).toHaveBeenCalledWith("星野咖啡");
  });

  it("没有商家时提供预设和新增入口", () => {
    const props = setup({ merchants: [], frequentMerchants: [] });
    click("从预设添加");
    expect(props.onAddPresets).toHaveBeenCalledOnce();
    click("新增商家");
    expect(props.onAddMerchant).toHaveBeenCalledWith();
  });

  it("不传新增回调时不显示新增商家与从预设添加（编辑记账）", () => {
    const { unmount } = renderEntryComponent(
      <MerchantStep
        {...merchantStepFixture}
        merchants={[]}
        frequentMerchants={[]}
        onAddMerchant={undefined}
        onAddPresets={undefined}
      />,
    );
    expect(screen.getByText("还没有商家")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    unmount();
    renderEntryComponent(
      <MerchantStep
        {...merchantStepFixture}
        onAddMerchant={undefined}
        onAddPresets={undefined}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "星野咖啡" },
    });
    expect(screen.getByText("没有找到“星野咖啡”")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /新增商家/ }),
    ).not.toBeInTheDocument();
  });

  it("常用商家直接显示传入数据，不在前端重复截取", () => {
    const merchants = Array.from({ length: 10 }, (_, index) => ({
      ...flowFixture.merchants[0],
      id: `merchant-${index}`,
      name: `商家${index}`,
    }));
    setup({
      merchants,
      frequentMerchants: merchants.map((merchant) => ({
        merchantId: merchant.id,
        recordCount: 1,
      })),
    });
    expect(
      within(screen.getByRole("group", { name: "常用商家" })).getAllByRole(
        "button",
      ),
    ).toHaveLength(10);
  });
  it("点击商家时把完整商家数据通知外部", () => {
    const props = setup();
    click("7-Eleven");
    expect(props.onSelect).toHaveBeenCalledWith(flowFixture.merchants[1]);
  });
  it("读取建议期间被点中的商家在头像和列表行显示加载状态", () => {
    setup({ loadingMerchantId: "seven" });
    expect(
      screen.getAllByRole("progressbar", { name: "正在读取 7-Eleven 的记录" }),
    ).toHaveLength(2);
    expect(
      within(screen.getByRole("group", { name: "常用商家" }))
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-busy") === "true"),
    ).toHaveLength(1);
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  });
});
