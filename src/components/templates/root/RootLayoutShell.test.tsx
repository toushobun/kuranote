import type { CSSProperties, ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { RootLayoutShell } from "./RootLayoutShell";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

type ElementProps = {
  children?: ReactNode;
  id?: string;
  style?: CSSProperties;
};

function elementProps(node: ReactNode) {
  expect(isValidElement(node)).toBe(true);
  return (node as ReactElement<ElementProps>).props;
}

function bodyChildrenProps(bodyProps: ElementProps) {
  return (bodyProps.children as ReactNode[]).map(elementProps);
}

describe("RootLayoutShell", () => {
  it("背景覆盖根视口而内容从顶部安全区之后开始", async () => {
    const root = await RootLayoutShell({ children: <main>页面内容</main> });
    const html = elementProps(root);
    const body = elementProps(html.children);
    const [scrim, appRoot] = bodyChildrenProps(body);

    expect(html.style).toMatchObject({
      "--user-theme-page-top-bg": "#FEF3DC",
    });
    expect(appRoot.id).toBe("app-root");
    expect(appRoot.style).toMatchObject({
      background: "var(--user-theme-page-bg)",
      paddingTop: "var(--app-safe-area-inset-top)",
    });
    expect(scrim.id).toBe("app-status-bar-scrim");
  });

  it("状态栏遮罩恒定盖住安全区高度且不拦截点击", async () => {
    const root = await RootLayoutShell({ children: <main>页面内容</main> });
    const html = elementProps(root);
    const body = elementProps(html.children);
    const [scrim] = bodyChildrenProps(body);

    expect(scrim.style).toMatchObject({
      height: "var(--app-safe-area-inset-top)",
      pointerEvents: "none",
      position: "fixed",
      top: 0,
    });
  });
});
