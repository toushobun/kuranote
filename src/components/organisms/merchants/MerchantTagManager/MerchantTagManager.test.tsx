import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MerchantTagManager } from "./MerchantTagManager";

const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
  { icon: "📦", id: "tag-2", merchant_count: 1, name: "电商", sort_order: 1 },
];
const action = vi.fn(async () => ({}));

describe("MerchantTagManager", () => {
  it("标签徽标保留关键词并切换筛选", () => {
    render(<MerchantTagManager canManage keyword="Life" tags={tags} />);
    expect(screen.getByRole("link", { name: /超市/ })).toHaveAttribute(
      "href",
      "/merchants?q=Life&tagId=tag-1",
    );
  });

  it("通过独立页面管理标签，并用方形卡片显示选中态", () => {
    render(
      <MerchantTagManager
        canManage
        keyword=""
        selectedTagId="tag-1"
        tags={tags}
      />,
    );

    expect(screen.getByRole("link", { name: "管理标签" })).toHaveAttribute(
      "href",
      "/merchants/tags",
    );
    expect(screen.getByRole("link", { name: /超市/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("button", { name: "新增标签" }),
    ).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "新增标签" }));
    expect(
      screen.getByRole("heading", { name: "新增标签" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "新增标签" }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "编辑超市" }));
    expect(
      screen.getByRole("heading", { name: "编辑标签" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "归档标签" }),
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

    fireEvent.click(screen.getByRole("button", { name: "新增标签" }));
    fireEvent.change(screen.getByLabelText("标签名称"), {
      target: { value: "重复标签" },
    });
    fireEvent.click(screen.getByRole("button", { name: "选择图标" }));
    fireEvent.click(screen.getByRole("button", { name: "选择电商图标" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    fireEvent.click(screen.getByRole("button", { name: "新增" }));
    await waitFor(() => expect(createAction).toHaveBeenCalledOnce());

    await act(async () => {
      resolveCreate?.({ error: "标签名称重复。", errorKey: "failure-1" });
    });

    expect(
      screen.getByRole("heading", { name: "新增标签" }),
    ).toBeInTheDocument();
    expect(document.querySelector('input[name="name"]')).toHaveValue(
      "重复标签",
    );
    expect(document.querySelector('input[name="icon"]')).toHaveValue("📦");
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
    fireEvent.change(screen.getByLabelText("标签名称"), {
      target: { value: "重复标签" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(updateAction).toHaveBeenCalledOnce());

    await act(async () => {
      resolveUpdate?.({ error: "标签名称重复。", errorKey: "failure-2" });
    });

    expect(
      screen.getByRole("heading", { name: "编辑标签" }),
    ).toBeInTheDocument();
    expect(document.querySelector('input[name="name"]')).toHaveValue(
      "重复标签",
    );
  });
});
