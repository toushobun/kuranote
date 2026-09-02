import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MerchantTagsTemplate } from "./MerchantTags";

const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
];
const action = vi.fn(async () => ({}));

describe("MerchantTagsTemplate", () => {
  it("显示独立商家标签管理页并返回商家列表", () => {
    render(
      <MerchantTagsTemplate
        archiveAction={action}
        createAction={action}
        reorderAction={async () => ({})}
        tags={tags}
        updateAction={action}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "商家标签管理" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "完成" })).toHaveAttribute(
      "href",
      "/merchants",
    );
    fireEvent.click(screen.getByRole("button", { name: "新增标签" }));
    expect(
      screen.getByRole("heading", { name: "新增标签" }),
    ).toBeInTheDocument();
  });
});
