import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createMerchantRow } from "@/test/mocks/merchants";

import { MerchantsTemplate } from "./Merchants";

const componentSource = readFileSync(
  join(process.cwd(), "src/components/templates/merchants/Merchants.tsx"),
  "utf8",
);

afterEach(cleanup);

const baseProps = {
  keyword: "",
  ledgerId: "ledger-1",
  merchants: [createMerchantRow()],
  selectedTag: null,
  tagFilterError: null,
  tags: [],
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
    const tagsHeading = screen.getByText("商家标签");
    expect(
      search.compareDocumentPosition(tagsHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(document.querySelector('input[name="tagId"]')).toHaveValue("tag-1");
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

  it("标签筛选失效时显示原因和清除入口", () => {
    render(
      <MerchantsTemplate
        {...baseProps}
        keyword="  LIFE 超市  "
        merchants={[]}
        tagFilterError="该商家标签不存在或已不可用。"
      />,
    );

    expect(
      screen.getByText("该商家标签不存在或已不可用。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "清除筛选" })).toHaveAttribute(
      "href",
      "/merchants?q=LIFE%20%E8%B6%85%E5%B8%82",
    );
    expect(screen.getByText("没有找到匹配的商家")).toBeInTheDocument();
  });
});
