import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionSetupHintCard } from "./TransactionSetupHintCard";
import {
  getNormalTransactionSetupHint,
  getTransferTransactionSetupHint,
  type TransactionSetupHint,
} from "./transactionSetupHint";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const addAccountHref = "/accounts?create=1";
const addMerchantHref = "/merchants/new";

afterEach(() => {
  cleanup();
});

function renderHintCard(hint: TransactionSetupHint | null) {
  if (!hint) throw new Error("hint is required");

  render(
    <TransactionSetupHintCard
      addAccountHref={addAccountHref}
      addMerchantHref={addMerchantHref}
      hint={hint}
    />,
  );

  return {
    links: screen.queryAllByRole("link"),
    region: screen.getByRole("region", { name: hint.title }),
  };
}

describe("TransactionSetupHintCard", () => {
  it("账户和商家都没有时显示两个添加入口", () => {
    const { links, region } = renderHintCard(
      getNormalTransactionSetupHint({ accountCount: 0, merchantCount: 0 }),
    );

    expect(region).toHaveTextContent("还差一点准备");
    expect(region).toHaveTextContent(
      "记账需要至少一个账户和一个商家，添加后就能保存啦",
    );
    expect(links.map((link) => link.textContent)).toEqual([
      "添加账户",
      "添加商家",
    ]);
    expect(screen.getByRole("link", { name: "添加账户" })).toHaveAttribute(
      "href",
      addAccountHref,
    );
    expect(screen.getByRole("link", { name: "添加商家" })).toHaveAttribute(
      "href",
      addMerchantHref,
    );
  });

  it("只缺商家时只显示添加商家", () => {
    const { links, region } = renderHintCard(
      getNormalTransactionSetupHint({ accountCount: 1, merchantCount: 0 }),
    );

    expect(region).toHaveTextContent("还差一个商家");
    expect(region).toHaveTextContent("添加一个常去的商家，就能保存这笔记录了");
    expect(links.map((link) => link.textContent)).toEqual(["添加商家"]);
  });

  it("只缺账户时只显示添加账户", () => {
    const { links, region } = renderHintCard(
      getNormalTransactionSetupHint({ accountCount: 0, merchantCount: 1 }),
    );

    expect(region).toHaveTextContent("还差一个账户");
    expect(region).toHaveTextContent("添加一个账户，就能保存这笔记录了");
    expect(links.map((link) => link.textContent)).toEqual(["添加账户"]);
  });

  it("转账账户不足时显示转账说明与添加账户", () => {
    const { links, region } = renderHintCard(
      getTransferTransactionSetupHint(0),
    );

    expect(region).toHaveTextContent("还差两个账户");
    expect(region).toHaveTextContent("转账需要至少两个账户");
    expect(links.map((link) => link.textContent)).toEqual(["添加账户"]);
  });
});
