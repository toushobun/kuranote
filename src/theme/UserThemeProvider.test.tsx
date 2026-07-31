import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider } from "./UserThemeProvider";
import {
  getUserThemeStorageKey,
  userThemeCookieName,
} from "./userThemeStorage";

describe("UserThemeProvider", () => {
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

  it("退出登录卸载 protected provider 时会恢复默认主题背景", () => {
    vi.useFakeTimers();
    window.localStorage.setItem(
      getUserThemeStorageKey("a@example.com"),
      "emeraldMorning",
    );

    document.documentElement.dataset.userTheme = "emeraldMorning";

    const { unmount } = render(
      <UserThemeProvider storageScope="a@example.com">
        <div />
      </UserThemeProvider>,
    );

    expect(document.documentElement.dataset.userTheme).toBe("emeraldMorning");
    expect(document.cookie).toContain(`${userThemeCookieName}=emeraldMorning`);

    unmount();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.documentElement.dataset.userTheme).toBe("amberWarmth");
    expect(document.cookie).not.toContain(userThemeCookieName);
    expect(
      document.documentElement.style.getPropertyValue("--user-theme-page-bg"),
    ).toContain("#FEF3DC");
  });

  it("protected provider 重新挂载时不会短暂恢复默认主题", () => {
    vi.useFakeTimers();
    window.localStorage.setItem(
      getUserThemeStorageKey("a@example.com"),
      "emeraldMorning",
    );

    document.documentElement.dataset.userTheme = "emeraldMorning";

    const firstRender = render(
      <UserThemeProvider storageScope="a@example.com">
        <div />
      </UserThemeProvider>,
    );

    firstRender.unmount();

    const secondRender = render(
      <UserThemeProvider storageScope="a@example.com">
        <div />
      </UserThemeProvider>,
    );

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.documentElement.dataset.userTheme).toBe("emeraldMorning");

    // 清理第二次挂载，并触发延迟的默认主题重置。
    secondRender.unmount();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.documentElement.dataset.userTheme).toBe("amberWarmth");
  });

  it("Suspense 延迟重挂载到下一轮任务时不会恢复默认主题", () => {
    vi.useFakeTimers();
    window.history.pushState(null, "", "/statistics?month=2026-06");
    window.localStorage.setItem(
      getUserThemeStorageKey("a@example.com"),
      "emeraldMorning",
    );

    document.documentElement.dataset.userTheme = "emeraldMorning";

    const firstRender = render(
      <UserThemeProvider storageScope="a@example.com">
        <div />
      </UserThemeProvider>,
    );

    firstRender.unmount();

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.documentElement.dataset.userTheme).toBe("emeraldMorning");
    expect(document.cookie).toContain(`${userThemeCookieName}=emeraldMorning`);

    const secondRender = render(
      <UserThemeProvider storageScope="a@example.com">
        <div />
      </UserThemeProvider>,
    );

    expect(document.documentElement.dataset.userTheme).toBe("emeraldMorning");

    secondRender.unmount();
    window.history.pushState(null, "", "/login");

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(document.documentElement.dataset.userTheme).toBe("amberWarmth");
    expect(document.cookie).not.toContain(userThemeCookieName);
  });

  it("旧主题 key 不再迁移，统一回退到默认主题", () => {
    window.localStorage.setItem(
      getUserThemeStorageKey("a@example.com"),
      "jade_morning_dew",
    );

    render(
      <UserThemeProvider storageScope="a@example.com">
        <div />
      </UserThemeProvider>,
    );

    expect(document.documentElement.dataset.userTheme).toBe("amberWarmth");
    expect(document.cookie).toContain(`${userThemeCookieName}=amberWarmth`);
  });
});
