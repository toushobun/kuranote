import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SoftCard } from "atoms/ui/SoftCard";
import { designTokens } from "theme/theme";

afterEach(() => {
  cleanup();
});

describe("style token components", () => {
  it("SoftCard 使用共通圆角 token", () => {
    const { container } = render(
      <SoftCard data-testid="soft-card">内容</SoftCard>,
    );

    expect(container.querySelector("[data-testid='soft-card']")).toHaveStyle({
      borderRadius: `${designTokens.radius.lg}px`,
    });
  });
});
