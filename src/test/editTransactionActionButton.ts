import { expect } from "vitest";
import { designTokens } from "theme/theme";

export function expectEditTransactionActionButton(button: HTMLElement) {
  expect(button).toHaveClass("MuiButton-fullWidth", "MuiButton-sizeLarge");
  expect(button).toHaveStyle({
    minHeight: "48px",
    fontSize: "1rem",
    fontWeight: "800",
    borderRadius: `${designTokens.radius.md}px`,
    padding: "8px 20px",
  });
}
