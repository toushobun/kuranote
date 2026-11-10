import { act, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { createGuardHistoryPort } from "./guardHistory";

/** 页面测试隔离异步历史遍历；真实 Next/浏览器兼容性由 tests/browser 验证。 */
export function setupGuardHistoryMock({ trackUrls = false } = {}) {
  let restore: () => void;
  let browser: ReturnType<typeof createGuardHistoryPort>;
  beforeEach(() => {
    browser = createGuardHistoryPort();
    const originalUrl = window.location.href;
    const replaceUrl = window.history.replaceState.bind(window.history);
    const urls = [originalUrl, originalUrl];
    browser.onPop(() => {
      if (trackUrls) replaceUrl(null, "", urls[browser.index()]);
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: browser.port.state() }),
      );
    });
    const state = vi
      .spyOn(window.history, "state", "get")
      .mockImplementation(browser.port.state);
    const push = vi
      .spyOn(window.history, "pushState")
      .mockImplementation((state, _, url) => {
        if (trackUrls)
          urls[browser.index() + 1] = new URL(
            url ?? window.location.href,
            window.location.href,
          ).href;
        browser.port.push(state);
      });
    const replace = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation((state, _, url) => {
        if (trackUrls && url != null) {
          replaceUrl(null, "", url);
          urls[browser.index()] = window.location.href;
        }
        browser.port.replace(state);
      });
    const go = vi
      .spyOn(window.history, "go")
      .mockImplementation((delta = 0) => browser.port.go(delta));
    const back = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => window.history.go(-1));
    const forward = vi
      .spyOn(window.history, "forward")
      .mockImplementation(() => window.history.go(1));
    const scroll = vi
      .spyOn(window, "scrollTo")
      .mockImplementation((options: number | ScrollToOptions = 0, y = 0) => {
        browser.port.scrollTo(
          typeof options === "number"
            ? { x: options, y }
            : {
                x: options.left ?? browser.port.scrollPosition().x,
                y: options.top ?? browser.port.scrollPosition().y,
              },
        );
      });
    const scrollX = vi
      .spyOn(window, "scrollX", "get")
      .mockImplementation(() => browser.port.scrollPosition().x);
    const scrollY = vi
      .spyOn(window, "scrollY", "get")
      .mockImplementation(() => browser.port.scrollPosition().y);
    const originalFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      queueMicrotask(() => callback(0));
      return 0;
    };
    restore = () => {
      for (const mock of [
        state,
        push,
        replace,
        go,
        back,
        forward,
        scroll,
        scrollX,
        scrollY,
      ])
        mock.mockRestore();
      window.requestAnimationFrame = originalFrame;
      if (trackUrls) replaceUrl(null, "", originalUrl);
    };
  });
  afterEach(async () => {
    cleanup();
    await browser.flush();
    restore();
  });
  return () => browser;
}

export async function backFromGuard(count = 1) {
  await waitFor(() => {
    if (window.history.state?.kuranoteUnsavedChanges?.position !== "sentinel")
      throw new Error("等待守卫哨兵");
  });
  await act(async () => {
    for (let index = 0; index < count; index++) window.history.back();
  });
}
