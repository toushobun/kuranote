import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TransactionPageTopBar } from "./TransactionPageTopBar";

afterEach(() => cleanup());

describe("TransactionPageTopBar", () => {
  it("保留关闭链接的地址及可访问名称", () => {
    render(<TransactionPageTopBar title="记一笔" />);

    expect(screen.getByRole("heading", { name: "记一笔" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "关闭" })).toHaveAttribute(
      "href",
      "/transactions",
    );
  });
});
