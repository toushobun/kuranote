import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import DataImportLoading from "./loading";

afterEach(() => {
  cleanup();
});

describe("DataImportLoading", () => {
  it("显示数据导入页面的加载状态", () => {
    const { container } = render(<DataImportLoading />);

    expect(
      within(container).getByRole("status", { name: "导入页面加载中" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("heading", { name: "数据导入" }),
    ).toBeInTheDocument();
  });
});
