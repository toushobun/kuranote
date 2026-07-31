import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LoadingState } from "./LoadingState";

afterEach(() => {
  cleanup();
});

describe("LoadingState", () => {
  it("以 status 显示读取状态", () => {
    const { container } = render(<LoadingState />);

    expect(within(container).getByRole("status")).toBeInTheDocument();
    expect(within(container).getByText("读取中")).toBeInTheDocument();
  });
});
