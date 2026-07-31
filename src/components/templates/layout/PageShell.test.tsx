import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageShell } from "./PageShell";

afterEach(() => {
  cleanup();
});

describe("PageShell", () => {
  it("显示页面内容", () => {
    const { container } = render(
      <PageShell>
        <p>页面内容</p>
      </PageShell>,
    );

    expect(within(container).getByRole("main")).toBeInTheDocument();
    expect(within(container).getByText("页面内容")).toBeInTheDocument();
  });
});
