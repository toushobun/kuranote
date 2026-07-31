import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageFrame } from "./PageFrame";

afterEach(() => {
  cleanup();
});

describe("PageFrame", () => {
  it("以 main 区域显示页面内容", () => {
    const { container } = render(
      <PageFrame>
        <p>页面内容</p>
      </PageFrame>,
    );

    expect(within(container).getByRole("main")).toBeInTheDocument();
    expect(within(container).getByText("页面内容")).toBeInTheDocument();
  });
});
