import { renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";

import { useScrollTopOnPathnameChange } from "./useScrollTopOnPathnameChange";

let mockedPathname = "/ledgers/ledger-1/settings";

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
}));

let scrollTo: MockInstance<typeof window.scrollTo>;

function renderScrollHook() {
  return renderHook(() => useScrollTopOnPathnameChange());
}

// 模拟浏览器前进 / 后退：地址先变为目标 URL，再触发 popstate。
function traverseTo(url: string) {
  window.history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

describe("useScrollTopOnPathnameChange", () => {
  beforeEach(() => {
    mockedPathname = "/ledgers/ledger-1/settings";
    window.history.replaceState(null, "", mockedPathname);
    scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("首次渲染时不滚动", () => {
    renderScrollHook();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("跳转到其他页面后滚回顶部", () => {
    const { rerender } = renderScrollHook();

    mockedPathname = "/dashboard";
    rerender();

    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
      left: 0,
      top: 0,
      behavior: "instant",
    });
  });

  it("pathname 不变时重新渲染不滚动", () => {
    const { rerender } = renderScrollHook();

    rerender();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("浏览器前进或后退时不滚动，交给浏览器恢复原位置", () => {
    const { rerender } = renderScrollHook();

    traverseTo("/dashboard");
    mockedPathname = "/dashboard";
    rerender();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("后退只改变 query 时，之后的普通跳转仍滚回顶部", () => {
    const { rerender } = renderScrollHook();

    traverseTo("/ledgers/ledger-1/settings?result=updated");
    rerender();
    mockedPathname = "/dashboard";
    rerender();

    expect(scrollTo).toHaveBeenCalledOnce();
  });
});
