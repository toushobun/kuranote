import { readFileSync } from "node:fs";
import { join } from "node:path";

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

import { MerchantsTemplate } from "./Merchants";

const componentSource = readFileSync(
  join(process.cwd(), "src/components/templates/merchants/Merchants.tsx"),
  "utf8",
);

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

const tagAction = async () => ({});
const reorderAction = async () => ({});

const baseProps = {
  setPreferredMerchantAliasAction: async () => ({ success: "显示名切换成功" }),
  archiveAction: tagAction,
  createAction: tagAction,
  keyword: "",
  ledgerId: "ledger-1",
  merchants: [createMerchantRow()],
  selectedTag: null,
  reorderAction,
  tagFilterError: null,
  tags: [],
  updateAction: tagAction,
};

function querySuccessFeedback() {
  return (
    screen
      .queryAllByRole("status")
      .find((status) =>
        within(status).queryByRole("button", { name: "关闭" }),
      ) ?? null
  );
}

async function reorderFirstTag() {
  fireEvent.click(screen.getByRole("button", { name: "管理分类" }));
  mockSortableRects({ "tag-1": 0, "tag-2": 100 });
  await dragSortable(
    screen.getByRole("button", { name: "调整超市排序" }),
    20,
    140,
  );
  await dropSortable();
}

describe("MerchantsTemplate", () => {
  it.each([
    ["created", "保存成功"],
    ["updated", "保存成功"],
    ["archived", "归档成功"],
  ] as const)(
    "操作后返回列表显示对应成功提示，关闭时清除结果参数并保留筛选：%s",
    async (result, title) => {
      window.history.replaceState(
        null,
        "",
        `/merchants?result=${result}&q=LIFE#list`,
      );
      const { unmount } = render(
        <MerchantsTemplate {...baseProps} saveResult={result} />,
      );

      expect(querySuccessFeedback()).toHaveTextContent(title);
      fireEvent.click(screen.getByRole("button", { name: "关闭" }));
      expect(replace).toHaveBeenCalledWith("/merchants?q=LIFE#list", {
        scroll: false,
      });
      await waitFor(() => expect(querySuccessFeedback()).toBeNull());

      unmount();
      window.history.replaceState(null, "", "/merchants?q=LIFE#list");
      render(<MerchantsTemplate {...baseProps} />);
      expect(querySuccessFeedback()).toBeNull();
    },
  );

  it("普通进入列表时不显示保存成功提示", () => {
    render(<MerchantsTemplate {...baseProps} />);
    expect(querySuccessFeedback()).toBeNull();
  });

  it("声明客户端边界以支持 MUI Link 组件", () => {
    expect(componentSource.startsWith('"use client";')).toBe(true);
  });

  it("保存成功提示向上偏移避开底部导航栏", () => {
    expect(componentSource).toContain(
      'import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";',
    );
    expect(componentSource).toContain("bottomOffset={feedbackBottomOffset}");
    expect(componentSource).toContain(
      "const feedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;",
    );
  });

  it("显示紧凑页面标题和独立新增入口", () => {
    const { container } = render(<MerchantsTemplate {...baseProps} />);

    expect(
      within(container).getByRole("heading", { name: "商家管理" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("管理常用商家和头像信息"),
    ).toBeInTheDocument();
    expect(within(container).queryByText(/当前账本/)).not.toBeInTheDocument();
    const createLink = within(container).getByRole("link", {
      name: "新增商家",
    });

    expect(createLink).toHaveAttribute("href", "/merchants/new");
    expect(createLink).toHaveClass("MuiButton-sizeSmall");
    expect(
      Number.parseFloat(getComputedStyle(createLink).borderRadius),
    ).toBeGreaterThan(100);
    expect(
      within(container).getByTestId("merchants-page-background"),
    ).toBeInTheDocument();
  });

  it("空状态不与搜索区同屏显示", () => {
    const { container } = render(
      <MerchantsTemplate {...baseProps} merchants={[]} />,
    );

    expect(within(container).getByText("还没有商家")).toBeInTheDocument();
    expect(
      within(container).queryByLabelText("搜索商家"),
    ).not.toBeInTheDocument();
  });

  it("有商家时保留搜索词", () => {
    const { container } = render(
      <MerchantsTemplate {...baseProps} keyword="便利" />,
    );

    expect(within(container).getByLabelText("搜索商家")).toHaveValue("便利");
  });

  it("搜索框显示在标签卡片之前，并在筛选时保留 tagId", () => {
    render(
      <MerchantsTemplate
        {...baseProps}
        selectedTag={{
          icon: "🛒",
          id: "tag-1",
          merchant_count: 1,
          name: "超市",
          sort_order: 0,
        }}
      />,
    );

    const search = screen.getByLabelText("搜索商家");
    const tagsHeading = screen.getByRole("heading", { name: "分类管理" });
    expect(
      search.compareDocumentPosition(tagsHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(document.querySelector('input[name="tagId"]')).toHaveValue("tag-1");
    expect(screen.getByRole("link", { name: "清除筛选" })).toHaveStyle({
      minHeight: "0",
      paddingBottom: "0",
      paddingTop: "0",
    });
  });

  it("在页面内展开分类管理并通过完成按钮收起", async () => {
    render(
      <MerchantsTemplate
        {...baseProps}
        tags={[
          {
            icon: "🛒",
            id: "tag-1",
            merchant_count: 1,
            name: "超市",
            sort_order: 0,
          },
        ]}
      />,
    );

    const manageButton = screen.getByRole("button", { name: "管理分类" });
    expect(manageButton).toHaveAttribute("aria-expanded", "false");
    expect(manageButton).not.toHaveAttribute("aria-controls");
    expect(screen.getByTestId("merchant-tag-filter-list")).toBeInTheDocument();
    expect(screen.getByTestId("merchant-tag-management-panel")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    fireEvent.click(manageButton);

    expect(screen.getByRole("button", { name: "完成" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "新增分类" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("merchant-tag-filter-list")).toBeInTheDocument();
    expect(
      screen.getByTestId("merchant-tag-filter-list").parentElement,
    ).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByTestId("merchant-tag-filter-list").parentElement,
    ).toHaveAttribute("inert");

    fireEvent.click(screen.getByRole("button", { name: "完成" }));
    expect(screen.getByTestId("merchant-tag-filter-list")).toBeInTheDocument();
    expect(
      screen.getByTestId("merchant-tag-filter-list").parentElement,
    ).toHaveAttribute("aria-hidden", "false");
    expect(
      screen.getByTestId("merchant-tag-filter-list").parentElement,
    ).not.toHaveAttribute("inert");
    expect(screen.getByTestId("merchant-tag-management-panel")).toHaveAttribute(
      "inert",
    );
    await waitFor(() => {
      expect(
        screen.getByTestId("merchant-tag-filter-list"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("merchant-tag-management-panel"),
      ).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("未筛选时显示分类筛选提示且筛选摘要没有分割线", () => {
    render(
      <MerchantsTemplate
        {...baseProps}
        tags={[
          {
            icon: "🛒",
            id: "tag-1",
            merchant_count: 1,
            name: "超市",
            sort_order: 0,
          },
        ]}
      />,
    );

    const hint = screen.getByText("可按分类筛选商家");
    expect(hint).toBeInTheDocument();
    expect(
      screen.getByTestId("TipsAndUpdatesOutlinedIcon"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "管理分类" })).toHaveStyle({
      minHeight: "36px",
      paddingBottom: "4px",
      paddingTop: "4px",
    });
    expect(
      getComputedStyle(hint.parentElement as HTMLElement).borderTopStyle,
    ).not.toBe("solid");
  });

  it("没有分类时不显示分类筛选提示", () => {
    render(<MerchantsTemplate {...baseProps} />);

    expect(screen.queryByText("可按分类筛选商家")).not.toBeInTheDocument();
  });

  it("展开后权限被移除时隐藏管理区并恢复筛选区", async () => {
    const tags = [
      {
        icon: "🛒",
        id: "tag-1",
        merchant_count: 1,
        name: "超市",
        sort_order: 0,
      },
    ];
    const { rerender } = render(
      <MerchantsTemplate {...baseProps} tags={tags} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "管理分类" }));
    expect(
      screen.getByRole("button", { name: "新增分类" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("搜索商家"), {
      target: { value: "尚未提交的搜索" },
    });

    rerender(
      <MerchantsTemplate
        {...baseProps}
        canManageMerchants={false}
        tags={tags}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "管理分类" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByTestId("merchant-tag-filter-list"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "新增分类" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("搜索商家")).toHaveValue("尚未提交的搜索");

    rerender(<MerchantsTemplate {...baseProps} tags={tags} />);

    expect(screen.getByRole("button", { name: "管理分类" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByTestId("merchant-tag-filter-list")).toBeInTheDocument();
  });

  it("只读成员不会挂载分类管理树", () => {
    render(
      <MerchantsTemplate
        {...baseProps}
        canManageMerchants={false}
        tags={[
          {
            icon: "🛒",
            id: "tag-1",
            merchant_count: 1,
            name: "超市",
            sort_order: 0,
          },
        ]}
      />,
    );

    expect(
      screen.queryByTestId("merchant-tag-management-panel"),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-merchant-tag-row-id="tag-1"]'),
    ).not.toBeInTheDocument();
  });

  it("权限移除后关闭并清除旧的新增弹窗", async () => {
    const tags = [
      {
        icon: "🛒",
        id: "tag-1",
        merchant_count: 1,
        name: "超市",
        sort_order: 0,
      },
    ];
    const { rerender } = render(
      <MerchantsTemplate {...baseProps} tags={tags} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "管理分类" }));
    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    expect(
      screen.getByRole("heading", { name: "新增分类" }),
    ).toBeInTheDocument();

    rerender(
      <MerchantsTemplate
        {...baseProps}
        canManageMerchants={false}
        tags={tags}
      />,
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "新增分类" }),
      ).not.toBeInTheDocument(),
    );

    rerender(<MerchantsTemplate {...baseProps} tags={tags} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "管理分类" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "管理分类" }));

    expect(
      screen.queryByRole("heading", { name: "新增分类" }),
    ).not.toBeInTheDocument();
  });

  it("权限移除后关闭并清除旧的编辑弹窗", async () => {
    const tags = [
      {
        icon: "🛒",
        id: "tag-1",
        merchant_count: 1,
        name: "超市",
        sort_order: 0,
      },
    ];
    const { rerender } = render(
      <MerchantsTemplate {...baseProps} tags={tags} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "管理分类" }));
    fireEvent.click(screen.getByRole("button", { name: "编辑超市" }));
    expect(
      screen.getByRole("heading", { name: "编辑分类" }),
    ).toBeInTheDocument();

    rerender(
      <MerchantsTemplate
        {...baseProps}
        canManageMerchants={false}
        tags={tags}
      />,
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "编辑分类" }),
      ).not.toBeInTheDocument(),
    );

    rerender(<MerchantsTemplate {...baseProps} tags={tags} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "管理分类" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "管理分类" }));

    expect(
      screen.queryByRole("heading", { name: "编辑分类" }),
    ).not.toBeInTheDocument();
  });

  it("分类排序提交期间禁止收起管理区", async () => {
    let resolveReorder: ((state: Record<string, never>) => void) | null = null;
    const pendingReorderAction = async () =>
      new Promise<Record<string, never>>((resolve) => {
        resolveReorder = resolve;
      });
    render(
      <MerchantsTemplate
        {...baseProps}
        reorderAction={pendingReorderAction}
        tags={[
          {
            icon: "🛒",
            id: "tag-1",
            merchant_count: 1,
            name: "超市",
            sort_order: 0,
          },
          {
            icon: "🍽️",
            id: "tag-2",
            merchant_count: 2,
            name: "餐饮",
            sort_order: 1,
          },
        ]}
      />,
    );

    await reorderFirstTag();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "完成" })).toBeDisabled(),
    );

    await act(async () => resolveReorder?.({}));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "完成" })).toBeEnabled(),
    );
  });

  it("权限变化时保留进行中的排序请求及失败反馈", async () => {
    let resolveReorder:
      | ((state: { error: string; errorKey: string }) => void)
      | null = null;
    const pendingReorderAction = async () =>
      new Promise<{ error: string; errorKey: string }>((resolve) => {
        resolveReorder = resolve;
      });
    const tags = [
      {
        icon: "🛒",
        id: "tag-1",
        merchant_count: 1,
        name: "超市",
        sort_order: 0,
      },
      {
        icon: "🍽️",
        id: "tag-2",
        merchant_count: 2,
        name: "餐饮",
        sort_order: 1,
      },
    ];
    const { rerender } = render(
      <MerchantsTemplate
        {...baseProps}
        reorderAction={pendingReorderAction}
        tags={tags}
      />,
    );

    await reorderFirstTag();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "完成" })).toBeDisabled(),
    );

    rerender(
      <MerchantsTemplate
        {...baseProps}
        canManageMerchants={false}
        reorderAction={pendingReorderAction}
        tags={tags}
      />,
    );

    await act(async () =>
      resolveReorder?.({
        error: "分类排序未能保存。",
        errorKey: "permission-change-error",
      }),
    );

    expect(screen.getByText("分类排序失败")).toBeInTheDocument();
    expect(screen.getByText("分类排序未能保存。")).toBeInTheDocument();
  });

  it("搜索无结果时保留搜索框并显示搜索空状态", () => {
    const { container } = render(
      <MerchantsTemplate {...baseProps} keyword="便利" merchants={[]} />,
    );

    expect(within(container).getByLabelText("搜索商家")).toHaveValue("便利");
    expect(
      within(container).getByText("没有找到匹配的商家"),
    ).toBeInTheDocument();
    expect(
      within(container).queryByRole("link", { name: "添加第一个商家" }),
    ).not.toBeInTheDocument();
  });

  it("分类筛选失效时在管理区展开后仍显示原因和清除入口", () => {
    render(
      <MerchantsTemplate
        {...baseProps}
        keyword="  LIFE 超市  "
        merchants={[]}
        tagFilterError="该商家分类不存在或已不可用。"
      />,
    );

    expect(
      screen.getByText("该商家分类不存在或已不可用。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "清除筛选" })).toHaveAttribute(
      "href",
      "/merchants?q=LIFE%20%E8%B6%85%E5%B8%82",
    );
    expect(screen.getByText("没有找到匹配的商家")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "管理分类" }));

    expect(
      screen.getByText("该商家分类不存在或已不可用。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "清除筛选" })).toBeInTheDocument();
  });
});

describe("MerchantsTemplate 显示名切换", () => {
  it("点击别名与正式名提交同一 Action，重复成功均显示提示且保留 URL", async () => {
    window.history.replaceState(null, "", "/merchants?q=LIFE#list");
    const action = vi.fn<import("types/merchants").MerchantStateAction>(
      async () => ({ success: "显示名切换成功" }),
    );
    render(
      <MerchantsTemplate
        {...baseProps}
        merchants={[createMerchantRow({ aliases: [createMerchantAliasRow()] })]}
        setPreferredMerchantAliasAction={action}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "将来福设为展示名" }));
    await waitFor(() =>
      expect(querySuccessFeedback()).toHaveTextContent("显示名切换成功"),
    );
    expect(action.mock.calls[0][1].get("aliasId")).toBe("alias-1");
    expect(action.mock.calls[0][1].get("merchantId")).toBe(
      createMerchantRow().id,
    );
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => expect(querySuccessFeedback()).toBeNull());
    fireEvent.click(
      screen.getByRole("button", { name: "LIFE超市是当前展示名" }),
    );
    await waitFor(() =>
      expect(querySuccessFeedback()).toHaveTextContent("显示名切换成功"),
    );
    expect(action.mock.calls[1][1].get("aliasId")).toBe("");
    expect(replace).not.toHaveBeenCalled();
    expect(
      window.location.pathname + window.location.search + window.location.hash,
    ).toBe("/merchants?q=LIFE#list");
  });

  it("切换显示名前关闭旧保存成功提示，避免两个反馈重叠", async () => {
    window.history.replaceState(
      null,
      "",
      "/merchants?result=updated&q=LIFE#list",
    );
    const action = vi.fn<import("types/merchants").MerchantStateAction>(
      async () => ({ success: "显示名切换成功" }),
    );
    render(
      <MerchantsTemplate
        {...baseProps}
        merchants={[createMerchantRow({ aliases: [createMerchantAliasRow()] })]}
        saveResult="updated"
        setPreferredMerchantAliasAction={action}
      />,
    );

    expect(querySuccessFeedback()).toHaveTextContent("保存成功");
    fireEvent.click(screen.getByRole("button", { name: "将来福设为展示名" }));

    expect(replace).toHaveBeenCalledWith("/merchants?q=LIFE#list", {
      scroll: false,
    });
    await waitFor(() =>
      expect(screen.getByText("显示名切换成功")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.queryByText("保存成功")).toBeNull());
  });

  it("请求期间阻止重复提交，失败时只显示安全错误且保留选中项", async () => {
    let finish!: (value: { error: string; errorKey: string }) => void;
    const action = vi.fn(
      () =>
        new Promise<{ error: string; errorKey: string }>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <MerchantsTemplate
        {...baseProps}
        merchants={[createMerchantRow({ aliases: [createMerchantAliasRow()] })]}
        setPreferredMerchantAliasAction={action}
      />,
    );
    const alias = screen.getByRole("button", { name: "将来福设为展示名" });
    fireEvent.click(alias);
    expect(alias).toBeDisabled();
    fireEvent.click(alias);
    expect(action).toHaveBeenCalledOnce();
    await act(async () =>
      finish({ error: "商家不可访问", errorKey: "failure-1" }),
    );
    await waitFor(() =>
      expect(screen.getByText("商家不可访问")).toBeInTheDocument(),
    );
    expect(screen.queryByText("显示名切换成功")).toBeNull();
    expect(
      screen.getByRole("button", { name: "LIFE超市是当前展示名" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(alias).toBeEnabled();
  });
});
