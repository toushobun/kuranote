import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { hasUseClientDirective } from "test/clientBoundary";

import { PageBackButton } from "./PageBackButton";

afterEach(() => cleanup());

describe("PageBackButton", () => {
  it("用无框箭头渲染可访问的返回链接", () => {
    render(<PageBackButton aria-label="返回设置" href="/settings" />);

    const link = screen.getByRole("link", { name: "返回设置" });
    expect(link).toHaveAttribute("href", "/settings");
    expect(link.querySelector("svg")).toBeInTheDocument();
    expect(getComputedStyle(link).width).toBe("40px");
    expect(getComputedStyle(link).height).toBe("40px");
    expect(getComputedStyle(link).boxShadow).not.toContain("14px");
    expect(getComputedStyle(link).borderTopStyle).not.toBe("solid");
  });

  it("客户端组件可从服务端 loading 页面引用", () => {
    expect(
      hasUseClientDirective(
        "src/components/atoms/ui/PageBackButton/PageBackButton.tsx",
      ),
    ).toBe(true);
  });
});
