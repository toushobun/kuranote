import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { designTokens } from "theme/theme";

import { MerchantTagManager } from "./MerchantTagManager";

const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
  { icon: "📦", id: "tag-2", merchant_count: 1, name: "电商", sort_order: 1 },
];
const action = vi.fn(async () => ({}));

describe("MerchantTagManager", () => {
  it("标签徽标保留关键词并切换筛选", () => {
    render(<MerchantTagManager keyword="Life" tags={tags} />);
    expect(screen.getByRole("link", { name: /超市/ })).toHaveAttribute(
      "href",
      "/merchants?q=Life&tagId=tag-1",
    );
  });

  it("以横向单行列表显示分类筛选并标记选中态", () => {
    render(<MerchantTagManager keyword="" selectedTagId="tag-1" tags={tags} />);

    expect(screen.queryByText("商家标签")).not.toBeInTheDocument();
    expect(
      screen.queryByText("按标签快速筛选常用商家"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("merchant-tag-filter-list")).toHaveStyle({
      flexWrap: "nowrap",
      overflowX: "auto",
    });
    const selectedTag = screen.getByRole("link", { name: /超市/ });
    expect(selectedTag).toHaveAttribute("aria-current", "page");
    expect(selectedTag).toHaveStyle({
      borderRadius: `${designTokens.radius.item}px`,
    });
    expect(
      screen.queryByRole("button", { name: "新增分类" }),
    ).not.toBeInTheDocument();
  });

  it("管理行显示分类数量、编辑入口与排序入口，不显示序号列", () => {
    const { container } = render(
      <MerchantTagManager
        archiveAction={action}
        createAction={action}
        mode="management"
        reorderAction={async () => ({})}
        tags={tags}
        updateAction={action}
      />,
    );

    const row = container.querySelector('[data-merchant-tag-row-id="tag-1"]');
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent("🛒超市2编辑");
    expect(row).not.toHaveTextContent("2 个商家");
    expect(
      screen.getByRole("button", { name: "编辑超市" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "调整超市排序" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "新增分类" }),
    ).toBeInTheDocument();
  });

  it("在管理模式打开新增与编辑弹窗", async () => {
    render(
      <MerchantTagManager
        archiveAction={action}
        createAction={action}
        mode="management"
        reorderAction={async () => ({})}
        tags={tags}
        updateAction={action}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    expect(
      screen.getByRole("heading", { name: "新增分类" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "分类名称" })).toHaveAttribute(
      "maxlength",
      "100",
    );
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "新增分类" }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "编辑超市" }));
    expect(
      screen.getByRole("heading", { name: "编辑分类" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "分类名称" })).toHaveAttribute(
      "maxlength",
      "100",
    );
    expect(
      screen.getByRole("button", { name: "归档分类" }),
    ).toBeInTheDocument();
  });

  it("新增失败时保留对话框和用户输入", async () => {
    let resolveCreate:
      | ((state: { error: string; errorKey: string }) => void)
      | null = null;
    const createAction = vi.fn(
      async () =>
        new Promise<{ error: string; errorKey: string }>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    render(
      <MerchantTagManager
        archiveAction={action}
        createAction={createAction}
        mode="management"
        reorderAction={async () => ({})}
        tags={tags}
        updateAction={action}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "新增分类" }));
    fireEvent.change(document.querySelector('input[name="name"]')!, {
      target: { value: "重复标签" },
    });
    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.click(screen.getByRole("button", { name: "选择电商图标" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "选择图标" }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "新增" }));
    await waitFor(() => expect(createAction).toHaveBeenCalledOnce());

    await act(async () => {
      resolveCreate?.({ error: "分类名称重复。", errorKey: "failure-1" });
    });

    expect(
      screen.getByRole("heading", { name: "新增分类" }),
    ).toBeInTheDocument();
    expect(document.querySelector('input[name="name"]')).toHaveValue(
      "重复标签",
    );
    expect(document.querySelector('input[name="icon"]')).toHaveValue("📦");
    expect(screen.getByText("分类新增失败")).toBeInTheDocument();
  });

  it("编辑失败时保留对话框和用户输入", async () => {
    let resolveUpdate:
      | ((state: { error: string; errorKey: string }) => void)
      | null = null;
    const updateAction = vi.fn(
      async () =>
        new Promise<{ error: string; errorKey: string }>((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    render(
      <MerchantTagManager
        archiveAction={action}
        createAction={action}
        mode="management"
        reorderAction={async () => ({})}
        tags={tags}
        updateAction={updateAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑超市" }));
    fireEvent.change(document.querySelector('input[name="name"]')!, {
      target: { value: "重复标签" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(updateAction).toHaveBeenCalledOnce());

    await act(async () => {
      resolveUpdate?.({ error: "分类名称重复。", errorKey: "failure-2" });
    });

    expect(
      screen.getByRole("heading", { name: "编辑分类" }),
    ).toBeInTheDocument();
    expect(document.querySelector('input[name="name"]')).toHaveValue(
      "重复标签",
    );
  });

  it("归档失败时保留编辑对话框", async () => {
    let resolveArchive:
      | ((state: { error: string; errorKey: string }) => void)
      | null = null;
    const archiveAction = vi.fn(
      async () =>
        new Promise<{ error: string; errorKey: string }>((resolve) => {
          resolveArchive = resolve;
        }),
    );
    render(
      <MerchantTagManager
        archiveAction={archiveAction}
        createAction={action}
        mode="management"
        reorderAction={async () => ({})}
        tags={tags}
        updateAction={action}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑超市" }));
    fireEvent.click(screen.getByRole("button", { name: "归档分类" }));
    await waitFor(() => expect(archiveAction).toHaveBeenCalledOnce());
    expect(
      screen.getByRole("heading", { name: "编辑分类" }),
    ).toBeInTheDocument();

    await act(async () => {
      resolveArchive?.({ error: "分类归档失败。", errorKey: "failure-3" });
    });

    expect(
      screen.getByRole("heading", { name: "编辑分类" }),
    ).toBeInTheDocument();
  });
});
