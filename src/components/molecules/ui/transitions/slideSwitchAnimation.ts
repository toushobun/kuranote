/** 并列内容切换的方向：1 = 新内容从右推入，-1 = 从左推入。 */
export type SlideDirection = 1 | -1;

type SlideSwitchOptions = {
  enter: HTMLElement;
  exit: HTMLElement;
  direction: SlideDirection;
  /** 与内容同时淡入的元素（如原地不动的标题栏里的标题文字）。 */
  fadeIn?: Element | null;
  duration: number;
  easing: string;
};

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

/** 按并列顺序决定方向：目标排在当前之后从右推入，否则从左推入。 */
export function slideDirectionBetween(
  order: readonly string[],
  from: string,
  to: string,
): SlideDirection {
  return order.indexOf(to) > order.indexOf(from) ? 1 : -1;
}

/** 一轮切换动画：finished 在结束或被取消时完成，cancel 立即取消本轮全部动画。 */
export type SlideSwitch = { finished: Promise<void>; cancel: () => void };

/**
 * 同级内容左右滑动切换（#1054 共用转场）：旧内容稍微滑出并变淡，新内容整屏推入；
 * 系统开启「减弱动态效果」时改为淡入淡出。浏览器不支持动画时立即完成。
 */
export function animateSlideSwitch({
  enter,
  exit,
  direction,
  fadeIn,
  duration,
  easing,
}: SlideSwitchOptions): SlideSwitch {
  if (typeof enter.animate !== "function") {
    return { finished: Promise.resolve(), cancel: () => {} };
  }
  const timing = { duration, easing };
  // 旧内容停在终点，避免动画结束到被移除之间闪回原位。
  const exitTiming = { ...timing, fill: "forwards" as const };
  const reduced = window.matchMedia?.(reducedMotionQuery).matches ?? false;
  const animations = reduced
    ? [
        exit.animate([{ opacity: 1 }, { opacity: 0 }], exitTiming),
        enter.animate([{ opacity: 0 }, { opacity: 1 }], timing),
      ]
    : [
        exit.animate(
          [
            { transform: "translateX(0)", opacity: 1 },
            { transform: `translateX(${-30 * direction}%)`, opacity: 0.6 },
          ],
          exitTiming,
        ),
        enter.animate(
          [
            { transform: `translateX(${100 * direction}%)` },
            { transform: "translateX(0)" },
          ],
          timing,
        ),
      ];
  if (fadeIn) {
    animations.push(fadeIn.animate([{ opacity: 0 }, { opacity: 1 }], timing));
  }
  return {
    // 动画被打断（取消）时同样视为结束。
    finished: Promise.allSettled(animations.map((a) => a.finished)).then(
      () => undefined,
    ),
    cancel: () => animations.forEach((animation) => animation.cancel()),
  };
}
