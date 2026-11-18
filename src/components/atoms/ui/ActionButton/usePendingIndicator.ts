import { useEffect, useRef, useState } from "react";

import { designTokens } from "theme/theme";

/** 请求开始就由 pending 锁定；这里只控制何时展示、何时撤销可见的处理中状态。 */
export function usePendingIndicator(pending: boolean) {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (pending) {
      if (visible) return;
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, designTokens.motion.actionButton.pendingDelay);
      return () => clearTimeout(timer);
    }

    if (!visible) return;
    const elapsed = Date.now() - (shownAt.current ?? Date.now());
    const remaining = Math.max(
      0,
      designTokens.motion.actionButton.minVisible - elapsed,
    );
    const timer = setTimeout(() => {
      shownAt.current = null;
      setVisible(false);
    }, remaining);
    return () => clearTimeout(timer);
  }, [pending, visible]);

  return visible;
}
