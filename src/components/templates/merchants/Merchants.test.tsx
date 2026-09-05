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
import { afterEach, describe, expect, it } from "vitest";

import { createMerchantRow } from "@/test/mocks/merchants";

import { MerchantsTemplate } from "./Merchants";

const componentSource = readFileSync(
  join(process.cwd(), "src/components/templates/merchants/Merchants.tsx"),
  "utf8",
);

afterEach(cleanup);

const tagAction = async () => ({});
const reorderAction = async () => ({});

const baseProps = {
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

describe("MerchantsTemplate", () => {
  it("声明客户端边界以支持 MUI Link 组件", () => {
    expect(componentSource.startsWith('"use client";')).toBe(true);
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

    fireEvent.click(manageButton);

    expect(screen.getByRole("button", { name: "完成" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "新增分类" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("merchant-tag-filter-list"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "完成" }));
    expect(
      screen.queryByTestId("merchant-tag-filter-list"),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByTestId("merchant-tag-filter-list"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "新增分类" }),
      ).not.toBeInTheDocument();
    });
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

    fireEvent.click(screen.getByRole("button", { name: "管理分类" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "调整超市排序" }), {
      key: "ArrowDown",
    });

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

    fireEvent.click(screen.getByRole("button", { name: "管理分类" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "调整超市排序" }), {
      key: "ArrowDown",
    });
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
