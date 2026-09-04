import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MerchantTagsField } from "./MerchantTagsField";

const tags = [
  { icon: "🛒", id: "tag-1", merchant_count: 2, name: "超市", sort_order: 0 },
  { icon: "📦", id: "tag-2", merchant_count: 1, name: "电商", sort_order: 1 },
];

describe("MerchantTagsField", () => {
  it("以 Chip 多选并输出重复隐藏字段", () => {
    const { container } = render(
      <MerchantTagsField initialTagIds={["tag-1"]} tags={tags} />,
    );
    expect(screen.getByText("商家分类")).toBeInTheDocument();
    fireEvent.click(screen.getByText("📦 电商"));
    expect(
      [...container.querySelectorAll('input[name="tagIds"]')].map(
        (input) => (input as HTMLInputElement).value,
      ),
    ).toEqual(["tag-1", "tag-2"]);
  });
});
