import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createMerchantRow } from "@/test/mocks/merchants";

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
      within(container).getByRole("link", { name: "添加第一个商家" }),
    ).toHaveAttribute("href", "/merchants/new");
  });

  it("有商家时只显示卡片列表", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[createMerchantRow()]} />,
    );

    expect(within(container).getByText("LIFE超市")).toBeInTheDocument();
    expect(within(container).queryByText("还没有商家")).not.toBeInTheDocument();
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
      within(container).queryByRole("link", { name: "添加第一个商家" }),
    ).not.toBeInTheDocument();
  });
});
