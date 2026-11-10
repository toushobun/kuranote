/** 并列内容切换的方向：1 = 新内容从右推入，-1 = 从左推入。 */
export type SlideDirection = 1 | -1;

type SlideSwitchOptions = {
  enter: HTMLElement;
  exit: HTMLElement;
  direction: SlideDirection;
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

/**
 * 同级内容左右滑动切换（#1054 共用转场）：旧内容稍微滑出并变淡，新内容整屏推入；
 * 系统开启「减弱动态效果」时改为淡入淡出。浏览器不支持动画时立即完成。
 */
export function animateSlideSwitch({
  enter,
  exit,
  direction,
  duration,
  easing,
}: SlideSwitchOptions): Promise<void> {
  if (typeof enter.animate !== "function") return Promise.resolve();
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
  // 动画被打断（取消）时同样视为结束。
  return Promise.allSettled(animations.map((a) => a.finished)).then(
    () => undefined,
  );
}
