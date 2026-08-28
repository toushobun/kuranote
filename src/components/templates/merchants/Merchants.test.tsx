import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createMerchantRow } from "@/test/mocks/merchants";

import { MerchantsTemplate } from "./Merchants";

afterEach(cleanup);

const baseProps = {
  keyword: "",
  ledgerId: "ledger-1",
  ledgerName: "家庭账本",
  merchants: [createMerchantRow()],
};

describe("MerchantsTemplate", () => {
  it("显示统一页面标题、账本和独立新增入口", () => {
    const { container } = render(<MerchantsTemplate {...baseProps} />);

    expect(
      within(container).getByRole("heading", { name: "商家管理" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("当前账本：家庭账本"),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("link", { name: "新增商家" }),
    ).toHaveAttribute("href", "/merchants/new");
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
});
