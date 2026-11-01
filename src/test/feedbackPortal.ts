import { expect } from "vitest";

export function expectFeedbackInBodyPortal(
  feedback: HTMLElement,
  ...excludedContainers: HTMLElement[]
) {
  expect(feedback.closest(".MuiSnackbar-root")?.parentElement).toBe(
    document.body,
  );
  for (const container of excludedContainers) {
    expect(container).not.toContainElement(feedback);
  }
}
