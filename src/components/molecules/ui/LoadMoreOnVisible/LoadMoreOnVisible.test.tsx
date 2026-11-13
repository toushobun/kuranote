import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoadMoreOnVisible } from "./LoadMoreOnVisible";

describe("LoadMoreOnVisible", () => {
  const observers: {
    callback: (entries: { isIntersecting: boolean }[]) => void;
    options?: IntersectionObserverInit;
  }[] = [];

  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(
        callback: (entries: { isIntersecting: boolean }[]) => void,
        options?: IntersectionObserverInit,
      ) {
        observers.push({ callback, options });
      }
      observe() {}
      disconnect() {}
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("抽屉内滚动时以最近可滚动容器为观察根节点", () => {
    const onVisible = vi.fn();
    const { container } = render(
      <div style={{ overflowY: "auto", maxHeight: 200 }}>
        <div style={{ height: 400 }}>候选内容</div>
        <LoadMoreOnVisible enabled isLoading={false} onVisible={onVisible} />
      </div>,
    );
    expect(observers).toHaveLength(1);
    expect(observers[0].options?.root).toBe(container.firstElementChild);
    act(() => observers[0].callback([{ isIntersecting: true }]));
    expect(onVisible).toHaveBeenCalledOnce();
  });

  it("普通列表使用视口，禁用时不观察", () => {
    const onVisible = vi.fn();
    const { rerender } = render(
      <LoadMoreOnVisible enabled isLoading={false} onVisible={onVisible} />,
    );
    expect(observers[0].options?.root).toBeNull();
    rerender(<LoadMoreOnVisible enabled={false} isLoading={false} onVisible={onVisible} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(onVisible).not.toHaveBeenCalled();
  });

  it("正在读取时显示进度但只通过可见性回调请求下一页", () => {
    const onVisible = vi.fn();
    render(<LoadMoreOnVisible enabled isLoading onVisible={onVisible} />);
    expect(screen.getByRole("progressbar")).toBeVisible();
    expect(onVisible).not.toHaveBeenCalled();
    act(() => observers[0].callback([{ isIntersecting: true }]));
    expect(onVisible).toHaveBeenCalledOnce();
  });
});
