import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { dragSortable, dropSortable, mockSortableRects } from "test/sortable";
import type { MerchantActionState } from "types/merchants";
import { MerchantList } from "./MerchantList";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const baseProps = { createHref: "/merchants/new", ledgerId: "ledger-1" };

describe("MerchantList", () => {
  it("没有商家时显示完整空状态和新增入口", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[]} />,
    );

    expect(within(container).getByText("还没有商家")).toBeInTheDocument();
    expect(
      within(container).getByRole("img", {
        name: "橙色遮阳棚的小店和门口的猫咪",
      }),
    ).toHaveAttribute(
      "src",
      "/assets/kura-merchant-empty/merchant_empty_amber_warmth.png",
    );
    expect(
      within(container).getByRole("link", { name: "添加第一个商家" }),
    ).toHaveAttribute("href", "/merchants/new");
  });

  it("有商家时只显示卡片列表", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[createMerchantRow()]} />,
    );

    expect(within(container).getByTestId("merchant-list")).toHaveStyle({
      gap: "8px",
    });
    expect(
      within(container).getByRole("heading", { name: "LIFE超市" }),
    ).toBeInTheDocument();
    expect(within(container).queryByText("还没有商家")).not.toBeInTheDocument();
  });

  it("切换显示名时只禁用当前商家的名称选项", async () => {
    let finishMerchantA!: () => void;
    const action = vi.fn((formData: FormData) => {
      if (formData.get("merchantId") !== "merchant-a") return Promise.resolve();

      return new Promise<void>((resolve) => {
        finishMerchantA = resolve;
      });
    });
    const merchantA = createMerchantRow({
      aliases: [
        createMerchantAliasRow({
          alias: "A别名",
          id: "alias-a",
          merchant_id: "merchant-a",
        }),
      ],
      id: "merchant-a",
      name: "商家A",
    });
    const merchantB = createMerchantRow({
      aliases: [
        createMerchantAliasRow({
          alias: "B别名",
          id: "alias-b",
          merchant_id: "merchant-b",
        }),
      ],
      id: "merchant-b",
      name: "商家B",
    });
    const { container } = render(
      <MerchantList
        {...baseProps}
        merchants={[merchantA, merchantB]}
        setPreferredAliasAction={action}
      />,
    );
    const merchantAAlias = within(container).getByRole("button", {
      name: "将A别名设为展示名",
    });
    const merchantAFormalName = within(container).getByRole("button", {
      name: "商家A是当前展示名",
    });
    const merchantBAlias = within(container).getByRole("button", {
      name: "将B别名设为展示名",
    });

    fireEvent.click(merchantAAlias);

    await waitFor(() => expect(merchantAAlias).toBeDisabled());
    expect(merchantAFormalName).toBeDisabled();
    expect(merchantBAlias).toBeEnabled();
    expect(action).toHaveBeenCalledOnce();
    expect(action.mock.calls[0][0].get("merchantId")).toBe("merchant-a");
    expect(action.mock.calls[0][0].get("aliasId")).toBe("alias-a");

    await act(async () => finishMerchantA());
    await waitFor(() => expect(merchantAAlias).toBeEnabled());
  });

  it("搜索无结果时显示搜索空状态且不显示新增入口", () => {
    const { container } = render(
      <MerchantList {...baseProps} keyword="便利" merchants={[]} />,
    );

    expect(
      within(container).getByText("没有找到匹配的商家"),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("没有找到与“便利”匹配的正式名或别名。"),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("img", {
        name: "拿着放大镜寻找商家的猫咪",
      }),
    ).toHaveAttribute(
      "src",
      "/assets/kura-search/search_illustration_amber_warmth.png",
    );
    expect(
      within(container).queryByRole("link", { name: "添加第一个商家" }),
    ).not.toBeInTheDocument();
  });

  it("分类筛选无结果时使用分类术语", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[]} tagFiltered />,
    );

    expect(
      within(container).getByText("当前分类下还没有商家。"),
    ).toBeInTheDocument();
  });
});

const sortableMerchants = [
  createMerchantRow({ id: "first", name: "商家甲" }),
  createMerchantRow({ id: "second", name: "商家乙" }),
];
function renderSortableList(
  props: Partial<Parameters<typeof MerchantList>[0]> = {},
) {
  mockSortableRects({ first: 0, second: 100 });
  return render(
    <MerchantList
      {...baseProps}
      merchants={sortableMerchants}
      reorderAction={async () => ({})}
      {...props}
    />,
  );
}
function merchantOrder() {
  return screen
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}
describe("商家排序", () => {
  it("手柄位于编辑按钮右侧，拖拽乐观更新且成功保留顺序", async () => {
    let finish!: (state: MerchantActionState) => void;
    const action = vi.fn<(formData: FormData) => Promise<MerchantActionState>>(
      () =>
        new Promise<MerchantActionState>((resolve) => {
          finish = resolve;
        }),
    );
    renderSortableList({ reorderAction: action });
    const handle = screen.getByRole("button", { name: "调整商家甲排序" });
    expect(
      screen.getByRole("link", { name: "编辑商家甲" }).nextElementSibling,
    ).toBe(handle);
    await dragSortable(handle, 40, 140);
    await dropSortable();
    expect(merchantOrder()).toEqual(["商家乙", "商家甲"]);
    expect(handle).toBeDisabled();
    expect(action).toHaveBeenCalledOnce();
    expect(action.mock.calls[0][0].get("merchantIds")).toBe(
      '["second","first"]',
    );
    await act(async () => finish({}));
    expect(handle).toBeEnabled();
    expect(merchantOrder()).toEqual(["商家乙", "商家甲"]);
  });
  it.each([false, true])(
    "保存失败回滚并显示反馈（网络异常：%s）",
    async (networkError) => {
      const action = vi.fn(async () => {
        if (networkError) throw new Error("private");
        return { error: "排序冲突，请刷新", errorKey: "failure" };
      });
      renderSortableList({ reorderAction: action });
      await dragSortable(
        screen.getByRole("button", { name: "调整商家甲排序" }),
        40,
        140,
      );
      await dropSortable();
      await waitFor(() =>
        expect(merchantOrder()).toEqual(["商家甲", "商家乙"]),
      );
      expect(
        await screen.findByText(
          networkError ? "商家排序保存失败，请稍后重试。" : "排序冲突，请刷新",
        ),
      ).toBeInTheDocument();
    },
  );
  it.each([{ keyword: "商家" }, { tagFiltered: true }])(
    "筛选期间保留手柄但禁止局部排序：%o",
    (props) => {
      renderSortableList(props);
      expect(
        screen.getByRole("button", { name: "调整商家甲排序" }),
      ).toBeDisabled();
    },
  );
  it("只读成员没有排序或编辑入口", () => {
    renderSortableList({ canManageMerchants: false });
    expect(
      screen.queryByRole("button", { name: "调整商家甲排序" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "编辑商家甲" }),
    ).not.toBeInTheDocument();
  });
});
