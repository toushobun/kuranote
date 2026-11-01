import { expect } from "vitest";

export function expectInBodyPortal(
  element: HTMLElement,
  rootSelector: string,
  ...excludedContainers: HTMLElement[]
) {
  expect(element.closest(rootSelector)?.parentElement).toBe(document.body);
  for (const container of excludedContainers) {
    expect(container).not.toContainElement(element);
  }
}
