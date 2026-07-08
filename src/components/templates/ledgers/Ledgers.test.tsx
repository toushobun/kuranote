import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { CurrentLedger } from "lib/ledger/current-ledger";

import { LedgersTemplate } from "./Ledgers";

afterEach(() => {
  cleanup();
});

const ledgers: CurrentLedger[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "家庭账本",
    baseCurrency: "JPY",
    currentUserRole: "owner",
    memberCount: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "旅行账本",
    baseCurrency: "JPY",
    currentUserRole: "admin",
    memberCount: 1,
  },
];

describe("LedgersTemplate", () => {
  it("显示账本管理页标题和新增账本入口", () => {
    const { container } = render(
      <LedgersTemplate
        currentLedgerId="00000000-0000-4000-8000-000000000001"
        ledgers={ledgers}
      />,
    );

    expect(
      within(container).getByRole("heading", { name: "账本管理" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("link", { name: /新增账本/ }),
    ).toHaveAttribute("href", "/ledgers/new");
  });

  it("显示当前账本摘要", () => {
    const { container } = render(
      <LedgersTemplate
        currentLedgerId="00000000-0000-4000-8000-000000000001"
        ledgers={ledgers}
      />,
    );

    const currentSection = within(container).getByRole("region", {
      name: "当前账本",
    });

    expect(within(currentSection).getByText("家庭账本")).toBeInTheDocument();
    expect(within(currentSection).getByText("成员 2 人")).toBeInTheDocument();
    expect(
      within(currentSection).getByText("默认货币 JPY"),
    ).toBeInTheDocument();
    expect(
      within(currentSection).getByText("我的角色 管理员"),
    ).toBeInTheDocument();
  });

  it("账本列表显示账本名称和当前使用状态", () => {
    const { container } = render(
      <LedgersTemplate
        currentLedgerId="00000000-0000-4000-8000-000000000001"
        ledgers={ledgers}
      />,
    );

    expect(within(container).getAllByText("家庭账本").length).toBeGreaterThan(0);
    expect(within(container).getByText("旅行账本")).toBeInTheDocument();
    expect(within(container).getAllByText("使用中").length).toBeGreaterThan(0);
  });

  it("点击账本列表项进入账本设置占位页", () => {
    const { container } = render(
      <LedgersTemplate
        currentLedgerId="00000000-0000-4000-8000-000000000001"
        ledgers={ledgers}
      />,
    );

    expect(
      within(container).getByRole("link", { name: /旅行账本/ }),
    ).toHaveAttribute(
      "href",
      "/ledgers/00000000-0000-4000-8000-000000000002/settings",
    );
  });

  it("无账本时显示空状态", () => {
    const { container } = render(
      <LedgersTemplate currentLedgerId="" ledgers={[]} />,
    );

    expect(within(container).getByText("你还没有任何账本")).toBeInTheDocument();
  });
});
