import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SettingsProfileLoading from "./loading";

afterEach(() => {
  cleanup();
});

describe("SettingsProfileLoading", () => {
  it("显示个人主页的加载状态", () => {
    const { container } = render(<SettingsProfileLoading />);

    expect(
      within(container).getByRole("status", { name: "个人主页加载中" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("heading", { name: "个人主页" }),
    ).toBeInTheDocument();
  });
});
