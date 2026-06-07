import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsCategoriesEntry } from "./SettingsCategoriesEntry";

afterEach(() => {
  cleanup();
});

describe("SettingsCategoriesEntry", () => {
  it("显示分类管理入口", () => {
    const { container } = render(<SettingsCategoriesEntry />);

    expect(
      within(container).getByRole("heading", { name: "分类管理" }),
    ).toBeTruthy();
    expect(
      within(container)
        .getByRole("link", { name: "打开分类管理" })
        .getAttribute("href"),
    ).toBe("/categories");
  });
});
