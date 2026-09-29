import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import SettingsPreferencesLoading from "./loading";

afterEach(() => {
  cleanup();
});

describe("SettingsPreferencesLoading", () => {
  it("显示 App 偏好设置页面的加载状态", () => {
    const { container } = render(<SettingsPreferencesLoading />);

    expect(
      within(container).getByRole("status", { name: "App 偏好设置加载中" }),
    ).toBeInTheDocument();
    expect(
      within(container).getByRole("heading", { name: "App 偏好设置" }),
    ).toBeInTheDocument();
  });
});
