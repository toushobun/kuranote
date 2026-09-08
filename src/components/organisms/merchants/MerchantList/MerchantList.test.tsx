import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantList } from "./MerchantList";

afterEach(cleanup);

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

  it("只禁用正在切换显示名的商家卡片", () => {
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
        pendingMerchantIds={new Set([merchantA.id])}
        setPreferredAliasAction={async () => {}}
      />,
    );

    expect(
      within(container).getByRole("button", { name: "将A别名设为展示名" }),
    ).toBeDisabled();
    expect(
      within(container).getByRole("button", { name: "将B别名设为展示名" }),
    ).toBeEnabled();
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
