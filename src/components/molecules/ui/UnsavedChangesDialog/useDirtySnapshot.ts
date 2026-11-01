import { useEffect, useRef } from "react";

/** 首次客户端初始化完成后建立基线，选择器草稿由调用方排除。 */
export function useDirtySnapshot(
  snapshot: string,
  onDirtyChange: ((dirty: boolean) => void) | null,
  ready: boolean,
) {
  const initial = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    initial.current ??= snapshot;
    onDirtyChange?.(snapshot !== initial.current);
  }, [snapshot, onDirtyChange, ready]);
}
