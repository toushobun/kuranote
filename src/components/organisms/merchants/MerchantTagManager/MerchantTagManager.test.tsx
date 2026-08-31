import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MerchantTagManager } from "./MerchantTagManager";

const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
  { icon: "📦", id: "tag-2", merchant_count: 1, name: "电商", sort_order: 1 },
];
const action = vi.fn(async () => ({}));

describe("MerchantTagManager", () => {
  it("标签徽标保留关键词并切换筛选", () => {
    render(
      <MerchantTagManager
        archiveAction={action}
        canManage
        createAction={action}
        keyword="Life"
        reorderAction={async () => ({})}
        tags={tags}
        updateAction={action}
      />,
    );
    expect(screen.getByRole("link", { name: /超市/ })).toHaveAttribute(
      "href",
      "/merchants?q=Life&tagId=tag-1",
    );
  });

  it("原地展开管理列表并打开新增与编辑弹窗", () => {
    render(
      <MerchantTagManager
        archiveAction={action}
        canManage
        createAction={action}
        keyword=""
        reorderAction={async () => ({})}
        tags={tags}
        updateAction={action}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "管理标签" }));
    expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "新增标签" }));
    expect(
      screen.getByRole("heading", { name: "新增标签" }),
    ).toBeInTheDocument();
  });
});
