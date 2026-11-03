import { useEffect, useRef } from "react";

/** 首次客户端初始化完成后建立基线，选择器草稿由调用方排除。 */
export function useDirtySnapshot(
  snapshot: string,
  onDirtyChange: ((dirty: boolean) => void) | null,
  ready: boolean,
  savedKey?: string,
) {
  const initial = useRef<string | null>(null);
  const lastSavedKey = useRef(savedKey);
  useEffect(() => {
    if (!ready) return;
    if (savedKey && savedKey !== lastSavedKey.current) {
      initial.current = snapshot;
      lastSavedKey.current = savedKey;
    }
    initial.current ??= snapshot;
    onDirtyChange?.(snapshot !== initial.current);
  }, [snapshot, onDirtyChange, ready, savedKey]);
}
