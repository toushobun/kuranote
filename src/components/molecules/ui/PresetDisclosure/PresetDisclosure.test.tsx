import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PresetDisclosurePanel } from "./PresetDisclosure";

function renderPanel(expanded: boolean) {
  return (
    <PresetDisclosurePanel id="panel" expanded={expanded}>
      <button type="button">内容</button>
    </PresetDisclosurePanel>
  );
}

describe("PresetDisclosurePanel", () => {
  it("首次展开前不渲染内容", () => {
    render(renderPanel(false));
    expect(screen.queryByRole("button", { hidden: true })).toBeNull();
  });

  it("展开过后收起时保留内容并隐藏，再次展开不重新挂载", async () => {
    const { rerender } = render(renderPanel(true));
    const content = screen.getByRole("button", { name: "内容" });

    rerender(renderPanel(false));
    await waitFor(() => expect(content).not.toBeVisible());
    expect(content).toBeInTheDocument();

    rerender(renderPanel(true));
    expect(screen.getByRole("button", { name: "内容" })).toBe(content);
  });
});
