import { expect } from "vitest";

// 隐藏字段不应让 Stack 的首个可见子元素产生额外上边距。
export function expectFirstVisibleStackChildHasNoTopMargin(
  stack: Element | null | undefined,
) {
  expect(stack).toBeDefined();
  expect(stack).not.toBeNull();
  if (!stack) return;

  const firstVisibleChild = Array.from(stack.children).find(
    (child) =>
      !child.matches('input[type="hidden"]') &&
      window.getComputedStyle(child).display !== "none",
  );
  expect(firstVisibleChild).toBeDefined();
  if (!firstVisibleChild) return;

  expect(
    Number.parseFloat(window.getComputedStyle(firstVisibleChild).marginTop) || 0,
  ).toBe(0);
}
