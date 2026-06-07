import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MerchantRow } from "types/merchants";

import { MerchantList } from "./MerchantList";

vi.mock("merchants/MerchantAliasForm", () => ({
  MerchantAliasForm: (): ReactNode => (
    <div data-testid="merchant-alias-form" />
  ),
}));

vi.mock("merchants/MerchantEditForm", () => ({
  MerchantEditForm: (): ReactNode => (
    <div data-testid="merchant-edit-form" />
  ),
}));

afterEach(() => {
  cleanup();
});

const baseMerchant: MerchantRow = {
  id: "00000000-0000-4000-8000-000000001001",
  name: "LIFE超市",
  website_url: "https://www.lifecorp.jp",
  icon_url: null,
  note: null,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  aliases: [],
};

const baseProps = {
  archiveAliasAction: vi.fn(async () => {}),
  archiveMerchantAction: vi.fn(async () => {}),
  createAliasAction: vi.fn(async () => {}),
  errorMerchantId: null,
  errorMessage: null,
  merchants: [],
  updateMerchantAction: vi.fn(async () => {}),
};

describe("MerchantList", () => {
  it("没有商家时显示空状态提示", () => {
    const { container } = render(<MerchantList {...baseProps} />);

    expect(within(container).getByText("还没有商家")).toBeTruthy();
  });

  it("有商家时显示商家名称", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[baseMerchant]} />,
    );

    expect(within(container).getByText("LIFE超市")).toBeTruthy();
  });

  it("有网址时显示网址链接", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[baseMerchant]} />,
    );

    expect(
      within(container).getByRole("link", { name: "https://www.lifecorp.jp" }),
    ).toBeTruthy();
  });

  it("无网址时显示网址未设置提示", () => {
    const { container } = render(
      <MerchantList
        {...baseProps}
        merchants={[{ ...baseMerchant, website_url: null }]}
      />,
    );

    expect(within(container).getByText("网址未设置")).toBeTruthy();
  });

  it("指定 errorMerchantId 的商家显示错误提示", () => {
    const { container } = render(
      <MerchantList
        {...baseProps}
        merchants={[baseMerchant]}
        errorMerchantId="00000000-0000-4000-8000-000000001001"
        errorMessage="商家归档失败。"
      />,
    );

    expect(within(container).getByRole("alert")).toBeTruthy();
    expect(within(container).getByText("商家归档失败。")).toBeTruthy();
  });

  it("errorMerchantId 不匹配时不显示错误提示", () => {
    const { container } = render(
      <MerchantList
        {...baseProps}
        merchants={[baseMerchant]}
        errorMerchantId="other-id"
        errorMessage="商家归档失败。"
      />,
    );

    expect(within(container).queryByRole("alert")).toBeNull();
  });

  it("有别名时显示别名列表", () => {
    const merchantWithAlias: MerchantRow = {
      ...baseMerchant,
      aliases: [
        {
          id: "alias-1",
          merchant_id: baseMerchant.id,
          alias: "来福",
          sort_order: 1,
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const { container } = render(
      <MerchantList {...baseProps} merchants={[merchantWithAlias]} />,
    );

    expect(within(container).getByText("来福")).toBeTruthy();
  });

  it("没有别名时显示暂无别名提示", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[baseMerchant]} />,
    );

    expect(within(container).getByText("还没有别名。")).toBeTruthy();
  });
});
