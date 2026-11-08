import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SettingsLoadingPage from "./loading";

afterEach(() => {
  cleanup();
});

describe("SettingsLoadingPage", () => {
  it("显示我的页面的加载状态", () => {
    const { container } = render(<SettingsLoadingPage />);

    expect(within(container).getByRole("status")).toBeInTheDocument();
    expect(
      within(container).getByRole("heading", { name: "我的" }),
    ).toBeInTheDocument();
  });

  it("一级页面不显示返回按钮", () => {
    const { container } = render(<SettingsLoadingPage />);

    expect(within(container).queryByRole("link")).not.toBeInTheDocument();
  });
});
