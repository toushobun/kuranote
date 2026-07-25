import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantList } from "./MerchantList";

vi.mock("organisms/merchants/MerchantAliasForm/MerchantAliasForm", () => ({
  MerchantAliasForm: (): ReactNode => <div data-testid="merchant-alias-form" />,
}));

vi.mock("organisms/merchants/MerchantEditForm/MerchantEditForm", () => ({
  MerchantEditForm: (): ReactNode => <div data-testid="merchant-edit-form" />,
}));

afterEach(() => {
  cleanup();
});

const baseMerchant = createMerchantRow();

const baseProps = {
  archiveAliasAction: vi.fn(async () => {}),
  archiveMerchantAction: vi.fn(async () => {}),
  createAliasAction: vi.fn(async () => {}),
  merchants: [],
  updateMerchantAction: vi.fn(async () => {}),
};

describe("MerchantList", () => {
  it("没有商家时显示空状态提示", () => {
    const { container } = render(<MerchantList {...baseProps} />);

    expect(within(container).getByText("还没有商家")).toBeInTheDocument();
  });

  it("有商家时显示商家名称", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[baseMerchant]} />,
    );

    expect(within(container).getByText("LIFE超市")).toBeInTheDocument();
  });

  it("有网址时显示网址链接", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[baseMerchant]} />,
    );

    expect(
      within(container).getByRole("link", { name: "https://www.lifecorp.jp" }),
    ).toBeInTheDocument();
  });

  it("无网址时显示网址未设置提示", () => {
    const { container } = render(
      <MerchantList
        {...baseProps}
        merchants={[createMerchantRow({ website_url: null })]}
      />,
    );

    expect(within(container).getByText("网址未设置")).toBeInTheDocument();
  });

  it("有别名时显示别名列表", () => {
    const merchantWithAlias = createMerchantRow({
      aliases: [createMerchantAliasRow()],
    });
    const { container } = render(
      <MerchantList {...baseProps} merchants={[merchantWithAlias]} />,
    );

    expect(within(container).getByText("来福")).toBeInTheDocument();
  });

  it("没有别名时显示暂无别名提示", () => {
    const { container } = render(
      <MerchantList {...baseProps} merchants={[baseMerchant]} />,
    );

    expect(within(container).getByText("还没有别名。")).toBeInTheDocument();
  });
});
