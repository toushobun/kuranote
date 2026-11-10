import { afterEach, describe, expect, it, vi } from "vitest";
import {
  animateSlideSwitch,
  slideDirectionBetween,
} from "./slideSwitchAnimation";

function animatedElement() {
  const element = document.createElement("div");
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel }));
  Object.assign(element, { animate });
  return { element, animate, cancel };
}

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches })),
  );
}

const timing = { duration: 300, easing: "ease-out" };

describe("slideDirectionBetween", () => {
  it("目标排在后面时从右推入，排在前面时从左推入", () => {
    const order = ["merchant", "transfer", "template"];
    expect(slideDirectionBetween(order, "merchant", "transfer")).toBe(1);
    expect(slideDirectionBetween(order, "template", "merchant")).toBe(-1);
  });
});

describe("animateSlideSwitch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("新内容按方向整屏推入，旧内容反向滑出并停在终点", async () => {
    mockReducedMotion(false);
    const enter = animatedElement();
    const exit = animatedElement();
    await animateSlideSwitch({
      enter: enter.element,
      exit: exit.element,
      direction: -1,
      ...timing,
    }).finished;
    expect(enter.animate).toHaveBeenCalledWith(
      [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }],
      timing,
    );
    expect(exit.animate).toHaveBeenCalledWith(
      [
        { transform: "translateX(0)", opacity: 1 },
        { transform: "translateX(30%)", opacity: 0.6 },
      ],
      { ...timing, fill: "forwards" },
    );
  });

  it("减弱动态效果时只淡入淡出", async () => {
    mockReducedMotion(true);
    const enter = animatedElement();
    const exit = animatedElement();
    await animateSlideSwitch({
      enter: enter.element,
      exit: exit.element,
      direction: 1,
      ...timing,
    }).finished;
    expect(enter.animate).toHaveBeenCalledWith(
      [{ opacity: 0 }, { opacity: 1 }],
      timing,
    );
    expect(exit.animate).toHaveBeenCalledWith(
      [{ opacity: 1 }, { opacity: 0 }],
      {
        ...timing,
        fill: "forwards",
      },
    );
  });

  it("动画被取消也视为结束", async () => {
    mockReducedMotion(false);
    const enter = document.createElement("div");
    const exit = document.createElement("div");
    const cancelled = () => ({
      finished: Promise.reject(new Error("abort")),
      cancel: vi.fn(),
    });
    Object.assign(enter, { animate: vi.fn(cancelled) });
    Object.assign(exit, { animate: vi.fn(cancelled) });
    await expect(
      animateSlideSwitch({ enter, exit, direction: 1, ...timing }).finished,
    ).resolves.toBeUndefined();
  });

  it("取消时停止本轮新旧两段动画", () => {
    mockReducedMotion(false);
    const enter = animatedElement();
    const exit = animatedElement();
    animateSlideSwitch({
      enter: enter.element,
      exit: exit.element,
      direction: 1,
      ...timing,
    }).cancel();
    expect(enter.cancel).toHaveBeenCalledTimes(1);
    expect(exit.cancel).toHaveBeenCalledTimes(1);
  });

  it("不支持动画时立即完成", async () => {
    const slide = animateSlideSwitch({
      enter: document.createElement("div"),
      exit: document.createElement("div"),
      direction: 1,
      ...timing,
    });
    await expect(slide.finished).resolves.toBeUndefined();
    expect(() => slide.cancel()).not.toThrow();
  });
});
