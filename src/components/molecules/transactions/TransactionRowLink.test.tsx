import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createTransactionListItem } from "@/test/mocks/transactions";

import { TransactionRowLink } from "./TransactionRowLink";

afterEach(() => {
  cleanup();
});

describe("TransactionRowLink", () => {
  it("整行链接到传入的记录页地址", () => {
    render(
      <TransactionRowLink
        href="/transactions/record-1/edit"
        item={createTransactionListItem({
          id: "record-1",
          merchant_name: "便利店",
        })}
      />,
    );

    expect(screen.getByRole("link", { name: /便利店/ })).toHaveAttribute(
      "href",
      "/transactions/record-1/edit",
    );
  });
});
