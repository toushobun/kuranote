import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { routePaths } from "config/paths";

import NotFound from "./not-found";
import { notFoundMessages } from "./notFoundMessages";

describe("NotFound", () => {
  afterEach(() => cleanup());

  it("使用应用浅色主题显示提示并提供返回记录列表的入口", () => {
    render(<NotFound />);

    expect(screen.getByText(notFoundMessages.title)).toHaveStyle({
      color: "var(--user-theme-tx-name)",
    });
    expect(
      screen.getByRole("link", { name: notFoundMessages.backToTransactions }),
    ).toHaveAttribute("href", routePaths.transactions);
  });
});
