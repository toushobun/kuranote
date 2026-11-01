import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { createGuardHistoryPort } from "./guardHistory";

/** 页面测试隔离异步历史遍历；真实 Next/浏览器兼容性由 tests/browser 验证。 */
export function setupGuardHistoryMock() {
  let restore: () => void;
  let browser: ReturnType<typeof createGuardHistoryPort>;
  beforeEach(() => {
    browser = createGuardHistoryPort();
    browser.onPop(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: browser.port.state() }),
      );
    });
    const state = vi
      .spyOn(window.history, "state", "get")
      .mockImplementation(browser.port.state);
    const push = vi
      .spyOn(window.history, "pushState")
      .mockImplementation(browser.port.push);
    const replace = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(browser.port.replace);
    const go = vi
      .spyOn(window.history, "go")
      .mockImplementation((delta = 0) => browser.port.go(delta));
    const back = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => window.history.go(-1));
    const forward = vi
      .spyOn(window.history, "forward")
      .mockImplementation(() => window.history.go(1));
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const originalFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      queueMicrotask(() => callback(0));
      return 0;
    };
    restore = () => {
      for (const mock of [state, push, replace, go, back, forward, scroll])
        mock.mockRestore();
      window.requestAnimationFrame = originalFrame;
    };
  });
  afterEach(async () => {
    cleanup();
    await browser.flush();
    restore();
  });
}
