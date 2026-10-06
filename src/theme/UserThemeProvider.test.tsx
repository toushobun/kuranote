import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserThemeProvider, useUserTheme } from "./UserThemeProvider";
import { userThemeCookieName } from "./userThemeStorage";

function ThemeKeyProbe() {
  const { themeKey } = useUserTheme();

  return <span data-testid="theme-key">{themeKey}</span>;
}

describe("UserThemeProvider", () => {
  beforeEach(() => {
    window.history.pushState(null, "", "/");
    document.cookie = `${userThemeCookieName}=; path=/; max-age=0; samesite=lax`;
    document.documentElement.removeAttribute("data-user-theme");
    document.documentElement.removeAttribute("style");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("服务端渲染首帧即为 initialThemeKey，不经过默认主题", () => {
    const markup = renderToString(
      <UserThemeProvider initialThemeKey="emeraldMorning">
        <ThemeKeyProbe />
      </UserThemeProvider>,
    );

    expect(markup).toContain(">emeraldMorning<");
    expect(markup).not.toContain("amberWarmth");
  });

  it("客户端首次渲染即为 initialThemeKey，并同步 <html> 与 cookie 缓存", () => {
    const renderedThemeKeys: string[] = [];

    function RecordingProbe() {
      const { themeKey } = useUserTheme();
      renderedThemeKeys.push(themeKey);
      return null;
    }

    render(
      <UserThemeProvider initialThemeKey="lavenderDream">
        <RecordingProbe />
      </UserThemeProvider>,
    );

    expect(renderedThemeKeys[0]).toBe("lavenderDream");
    expect(renderedThemeKeys).not.toContain("amberWarmth");
    expect(document.documentElement.dataset.userTheme).toBe("lavenderDream");
    expect(document.cookie).toContain(`${userThemeCookieName}=lavenderDream`);
  });

  it("cookie 中残留其他主题时以数据库下发的主题覆盖", () => {
    document.cookie = `${userThemeCookieName}=flameRed; path=/`;

    render(
      <UserThemeProvider initialThemeKey="sakuraStory">
        <div />
      </UserThemeProvider>,
    );

    expect(document.cookie).toContain(`${userThemeCookieName}=sakuraStory`);
    expect(document.cookie).not.toContain(`${userThemeCookieName}=flameRed`);
  });

  it("服务端重新下发主题时以数据库值为准", () => {
    const { getByTestId, rerender } = render(
      <UserThemeProvider initialThemeKey="sakuraStory">
        <ThemeKeyProbe />
      </UserThemeProvider>,
    );

    rerender(
      <UserThemeProvider initialThemeKey="deepSeaStarlight">
        <ThemeKeyProbe />
      </UserThemeProvider>,
    );

    expect(getByTestId("theme-key")).toHaveTextContent("deepSeaStarlight");
    expect(document.documentElement.dataset.userTheme).toBe("deepSeaStarlight");
  });

  it("退出登录卸载 protected provider 时会恢复默认主题背景", () => {
    vi.useFakeTimers();

    const { unmount } = render(
      <UserThemeProvider initialThemeKey="emeraldMorning">
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

    const firstRender = render(
      <UserThemeProvider initialThemeKey="emeraldMorning">
        <div />
      </UserThemeProvider>,
    );

    firstRender.unmount();

    const secondRender = render(
      <UserThemeProvider initialThemeKey="emeraldMorning">
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

    const firstRender = render(
      <UserThemeProvider initialThemeKey="emeraldMorning">
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
      <UserThemeProvider initialThemeKey="emeraldMorning">
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

  it("使用服务端注入的收支配色方案应用 CSS 变量", () => {
    render(
      <UserThemeProvider initialTransactionColorScheme="expense_red_income_green">
        <div />
      </UserThemeProvider>,
    );

    expect(
      document.documentElement.style.getPropertyValue(
        "--user-theme-income-amount",
      ),
    ).toBe("#42A87A");
    expect(
      document.documentElement.style.getPropertyValue(
        "--user-theme-negative-amount",
      ),
    ).toBe("#E8547A");
  });
});
