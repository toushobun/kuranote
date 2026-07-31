import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  getUserThemeStorageKey,
  userThemeCookieName,
} from "theme/userThemeStorage";

import { UserThemePicker } from "./UserThemePicker";

describe("UserThemePicker", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState(null, "", "/");
    document.cookie = `${userThemeCookieName}=; path=/; max-age=0; samesite=lax`;
    document.documentElement.removeAttribute("data-user-theme");
    document.documentElement.removeAttribute("style");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("主题选择器刷新后选中当前用户保存的主题，而不是先显示默认主题", async () => {
    window.localStorage.setItem(
      getUserThemeStorageKey("a@example.com"),
      "sakuraStory",
    );

    document.documentElement.dataset.userTheme = "sakuraStory";

    const initialMarkup = renderToString(
      <UserThemeProvider storageScope="a@example.com">
        <UserThemePicker />
      </UserThemeProvider>,
    );

    expect(initialMarkup).toContain('aria-hidden="true"');

    const { findByRole, getByRole, unmount } = render(
      <UserThemeProvider storageScope="a@example.com">
        <UserThemePicker />
      </UserThemeProvider>,
    );

    const sakuraOption = await findByRole("option", {
      name: "切换到粉樱物语",
    });

    expect(sakuraOption.getAttribute("aria-selected")).toBe("true");
    expect(
      getByRole("option", { name: "切换到薰衣草梦境" }).getAttribute(
        "aria-selected",
      ),
    ).toBe("false");

    vi.useFakeTimers();
    unmount();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.documentElement.dataset.userTheme).toBe("amberWarmth");
  });
});
