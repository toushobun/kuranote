"use client";

import { useEffect, useRef } from "react";

import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

/** 页尾进入当前滚动容器的可视范围时加载下一页。 */
export function LoadMoreOnVisible({
  enabled,
  isLoading,
  onVisible,
}: {
  enabled: boolean;
  isLoading: boolean;
  onVisible: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onVisibleRef = useRef(onVisible);

  useEffect(() => {
    onVisibleRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !enabled ||
      isLoading ||
      !sentinel ||
      typeof IntersectionObserver === "undefined"
    )
      return;

    // 底部抽屉的 paper 禁止滚动，实际滚动的是内层 body。
    // 按最近的纵向滚动祖先寻找 root，普通流水列表则使用视口。
    let root: HTMLElement | null = sentinel.parentElement;
    while (root) {
      const overflowY = window.getComputedStyle(root).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") break;
      root = root.parentElement;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onVisibleRef.current();
      },
      { root, rootMargin: "0px 0px 75% 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, isLoading]);

  if (!enabled) return null;

  return (
    <Stack
      ref={sentinelRef}
      sx={{ alignItems: "center", minHeight: 40, py: 1 }}
    >
      {isLoading ? <CircularProgress size={22} /> : null}
    </Stack>
  );
}
