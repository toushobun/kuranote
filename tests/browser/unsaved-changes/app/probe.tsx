"use client";

import { useEffect, type ReactNode } from "react";

/** 只统计真实路由卸载，Strict Mode 的首次重执行在结果里单独说明。 */
export function Probe({ children }: { children: ReactNode }) {
  useEffect(() => {
    const probe = window as Window & {
      probeMounts?: number;
      probeUnmounts?: number;
    };
    probe.probeMounts = (probe.probeMounts ?? 0) + 1;
    return () => {
      probe.probeUnmounts = (probe.probeUnmounts ?? 0) + 1;
    };
  }, []);
  return children;
}
