import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { hasUseClientDirective } from "test/clientBoundary";

import { SettingsPageBackButton } from "./SettingsPageBackButton";

afterEach(() => {
  cleanup();
});

describe("SettingsPageBackButton", () => {
  it("显示指向返回地址的返回链接", () => {
    const { container } = render(
      <SettingsPageBackButton href="/settings" label="返回设置" />,
    );

    expect(
      within(container).getByRole("link", { name: "返回设置" }),
    ).toHaveAttribute("href", "/settings");
  });

  it("声明客户端边界，使 loading.tsx 等 Server Component 也能渲染返回按钮", () => {
    expect(
      hasUseClientDirective(
        "src/components/templates/layout/SettingsPageBackButton.tsx",
      ),
    ).toBe(true);
  });
});
