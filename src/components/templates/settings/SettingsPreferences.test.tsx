import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsPreferencesTemplate } from "./SettingsPreferences";

vi.mock("molecules/theme/UserThemePicker", () => ({
  UserThemePicker: () => <div>主题选择器</div>,
}));
vi.mock(
  "molecules/theme/TransactionColorSchemePicker/TransactionColorSchemePicker",
  () => ({
    TransactionColorSchemePicker: () => <div>收支颜色选择器</div>,
  }),
);

const updateTransactionColorSchemeAction = vi.fn();

afterEach(() => {
  cleanup();
  updateTransactionColorSchemeAction.mockClear();
});

function renderSettingsPreferencesTemplate() {
  return render(
    <SettingsPreferencesTemplate
      updateTransactionColorSchemeAction={updateTransactionColorSchemeAction}
    />,
  );
}

describe("SettingsPreferencesTemplate", () => {
  it("显示标题、说明和返回设置入口", () => {
    const { container } = renderSettingsPreferencesTemplate();

    expect(
      within(container).getByRole("heading", { name: "App 偏好设置" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByText("调整主题外观、收支颜色与语言"),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("link", { name: "返回设置" }),
    ).toHaveAttribute("href", "/settings");
  });

  it("按主题换装、收支颜色、语言设置顺序显示入口", () => {
    const { container } = renderSettingsPreferencesTemplate();

    expect(
      within(container)
        .getAllByRole("button")
        .map((entry) => entry.textContent),
    ).toEqual(["主题换装", "收支颜色", "语言设置简体中文"]);
  });

  it("点击主题换装时展开主题选择器，再次点击时收起", () => {
    const { container } = renderSettingsPreferencesTemplate();
    const themeEntry = within(container).getByRole("button", {
      name: /主题换装/,
    });

    fireEvent.click(themeEntry);

    expect(themeEntry).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("主题选择器")).toBeInTheDocument();

    fireEvent.click(themeEntry);

    expect(themeEntry).toHaveAttribute("aria-expanded", "false");
  });

  it("点击收支颜色时显示收支颜色选择器", () => {
    const { container } = renderSettingsPreferencesTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /收支颜色/ }),
    );

    expect(screen.getByText("收支颜色选择器")).toBeInTheDocument();
  });

  it("展开一个选择器时收起另一个选择器", () => {
    const { container } = renderSettingsPreferencesTemplate();
    const themeEntry = within(container).getByRole("button", {
      name: /主题换装/,
    });
    const colorEntry = within(container).getByRole("button", {
      name: /收支颜色/,
    });

    fireEvent.click(themeEntry);
    expect(themeEntry).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(colorEntry);
    expect(themeEntry).toHaveAttribute("aria-expanded", "false");
    expect(colorEntry).toHaveAttribute("aria-expanded", "true");
  });

  it("点击语言设置时显示准备中提示", () => {
    const { container } = renderSettingsPreferencesTemplate();

    fireEvent.click(
      within(container).getByRole("button", { name: /语言设置/ }),
    );

    expect(screen.getByText("正在准备中")).toBeInTheDocument();
    expect(screen.queryByText("主题选择器")).not.toBeInTheDocument();
  });
});
