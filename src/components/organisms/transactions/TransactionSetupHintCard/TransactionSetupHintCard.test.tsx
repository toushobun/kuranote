import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TransactionSetupHintCard } from "./TransactionSetupHintCard";
import {
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

const addAccountHref = "/accounts/new";

afterEach(() => {
  cleanup();
});

function renderHintCard(hint: TransactionSetupHint | null) {
  if (!hint) throw new Error("hint is required");

  render(
    <TransactionSetupHintCard addAccountHref={addAccountHref} hint={hint} />,
  );

  return {
    links: screen.queryAllByRole("link"),
    region: screen.getByRole("region", { name: hint.title }),
  };
}

describe("TransactionSetupHintCard", () => {
  it("转账账户不足时显示转账说明与添加账户", () => {
    const { links, region } = renderHintCard(
      getTransferTransactionSetupHint(0),
    );

    expect(region).toHaveTextContent("还差两个账户");
    expect(region).toHaveTextContent("转账需要至少两个账户");
    expect(links.map((link) => link.textContent)).toEqual(["添加账户"]);
    expect(links[0]).toHaveAttribute("href", addAccountHref);
  });
});
