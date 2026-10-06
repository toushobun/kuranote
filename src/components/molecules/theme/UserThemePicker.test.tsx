import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { userErrorMessages, type UserThemeKey } from "internal/user";
import { UserThemeProvider } from "theme/UserThemeProvider";
import { userThemeCookieName } from "theme/userThemeStorage";
import type { ThemeKeyAction, ThemeKeyActionState } from "types/user";

import { UserThemePicker } from "./UserThemePicker";

function createPicker(
  action: ThemeKeyAction,
  initialThemeKey: UserThemeKey = "sakuraStory",
) {
  return (
    <UserThemeProvider initialThemeKey={initialThemeKey}>
      <UserThemePicker action={action} />
    </UserThemeProvider>
  );
}

function getOption(name: string) {
  return screen.getByRole("option", { name: `切换到${name}` });
}

describe("UserThemePicker", () => {
  beforeEach(() => {
    window.history.pushState(null, "", "/settings/preferences");
    document.cookie = `${userThemeCookieName}=; path=/; max-age=0; samesite=lax`;
    document.documentElement.removeAttribute("data-user-theme");
    document.documentElement.removeAttribute("style");
  });

  afterEach(() => {
    cleanup();
  });

  it("服务端渲染首帧即选中数据库中的主题，而不是默认主题", () => {
    const markup = renderToString(createPicker(vi.fn()));
    const container = document.createElement("div");
    container.innerHTML = markup;

    expect(
      container
        .querySelector('[aria-label="切换到粉樱物语"]')
        ?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      container
        .querySelector('[aria-label="切换到琥珀暖阳"]')
        ?.getAttribute("aria-selected"),
    ).toBe("false");
  });

  it("点击后立即切换主题并写库", async () => {
    const action = vi.fn<ThemeKeyAction>(async (_state, formData) => ({
      themeKey: formData.get("themeKey") as UserThemeKey,
    }));
    render(createPicker(action));

    fireEvent.click(getOption("薰衣草梦境"));

    expect(getOption("薰衣草梦境")).toHaveAttribute("aria-selected", "true");
    expect(document.documentElement.dataset.userTheme).toBe("lavenderDream");

    await waitFor(() => {
      expect(action).toHaveBeenCalledOnce();
    });
    expect(action.mock.calls[0][1].get("themeKey")).toBe("lavenderDream");
    expect(document.cookie).toContain(`${userThemeCookieName}=lavenderDream`);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("保存失败时回滚到原主题并显示安全错误", async () => {
    let finishSaving: ((state: ThemeKeyActionState) => void) | undefined;
    const action = vi.fn<ThemeKeyAction>(
      () =>
        new Promise((resolve) => {
          finishSaving = resolve;
        }),
    );
    render(createPicker(action));

    fireEvent.click(getOption("薰衣草梦境"));

    await waitFor(() => {
      expect(action).toHaveBeenCalledOnce();
    });
    expect(getOption("薰衣草梦境")).toHaveAttribute("aria-selected", "true");

    await act(async () => {
      finishSaving?.({
        error: userErrorMessages.themeKeyUpdateFailed,
        errorKey: "error-1",
      });
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      userErrorMessages.themeKeyUpdateFailed,
    );
    expect(getOption("粉樱物语")).toHaveAttribute("aria-selected", "true");
    expect(document.documentElement.dataset.userTheme).toBe("sakuraStory");
    expect(document.cookie).toContain(`${userThemeCookieName}=sakuraStory`);
  });

  it("Server Action 抛出异常时同样回滚并显示安全错误", async () => {
    const action = vi.fn<ThemeKeyAction>(async () => {
      throw new Error("network failed");
    });
    render(createPicker(action));

    fireEvent.click(getOption("薰衣草梦境"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        userErrorMessages.themeKeyUpdateFailed,
      );
    });
    expect(getOption("粉樱物语")).toHaveAttribute("aria-selected", "true");
  });

  it("保存中再次点击不会并发提交", async () => {
    let finishSaving: ((state: ThemeKeyActionState) => void) | undefined;
    const action = vi.fn<ThemeKeyAction>(
      () =>
        new Promise((resolve) => {
          finishSaving = resolve;
        }),
    );
    render(createPicker(action));

    fireEvent.click(getOption("薰衣草梦境"));
    await waitFor(() => {
      expect(action).toHaveBeenCalledOnce();
    });

    fireEvent.click(getOption("翡翠晨露"));

    expect(getOption("薰衣草梦境")).toHaveAttribute("aria-selected", "true");

    await act(async () => {
      finishSaving?.({ themeKey: "lavenderDream" });
    });

    expect(action).toHaveBeenCalledOnce();
  });

  it("点击当前主题时不提交", () => {
    const action = vi.fn<ThemeKeyAction>();
    render(createPicker(action));

    fireEvent.click(getOption("粉樱物语"));

    expect(action).not.toHaveBeenCalled();
  });
});
