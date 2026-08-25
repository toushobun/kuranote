import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "theme/UserThemeProvider";
import type { TransactionColorSchemeAction } from "types/user";

import { TransactionColorSchemePicker } from "./TransactionColorSchemePicker";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("style");
});

function renderPicker(
  action: TransactionColorSchemeAction,
  initialTransactionColorScheme:
    | "expense_green_income_red"
    | "expense_red_income_green" = "expense_green_income_red",
) {
  return render(
    <UserThemeProvider
      initialTransactionColorScheme={initialTransactionColorScheme}
      storageScope="picker-test"
    >
      <TransactionColorSchemePicker action={action} />
    </UserThemeProvider>,
  );
}

describe("TransactionColorSchemePicker", () => {
  it("显示两个互斥预设并标记服务端初值", () => {
    renderPicker(vi.fn());

    expect(
      screen.getByRole("button", { name: /支出绿 \/ 收入红/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /支出红 \/ 收入绿/ }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("保存成功后切换 Provider 配色并显示成功反馈", async () => {
    const action = vi.fn<TransactionColorSchemeAction>(
      async (_state, formData) => ({
        success: "收支配色方案已保存。",
        transactionColorScheme: formData.get(
          "transactionColorScheme",
        ) as "expense_red_income_green",
      }),
    );
    renderPicker(action);

    fireEvent.click(screen.getByRole("button", { name: /支出红 \/ 收入绿/ }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledOnce();
      expect(
        screen.getByRole("button", { name: /支出红 \/ 收入绿/ }),
      ).toHaveAttribute("aria-pressed", "true");
    });
    expect(screen.getByRole("status")).toHaveTextContent("保存成功");
    expect(
      document.documentElement.style.getPropertyValue(
        "--user-theme-negative-amount",
      ),
    ).toBe("#E8547A");
  });

  it("保存失败时保持原选择并显示安全错误", async () => {
    const action = vi.fn<TransactionColorSchemeAction>(async () => ({
      error: "收支配色方案保存失败，请稍后重试。",
      errorKey: "error-1",
    }));
    renderPicker(action);

    fireEvent.click(screen.getByRole("button", { name: /支出红 \/ 收入绿/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "收支配色方案保存失败，请稍后重试。",
      );
    });
    expect(
      screen.getByRole("button", { name: /支出绿 \/ 收入红/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
