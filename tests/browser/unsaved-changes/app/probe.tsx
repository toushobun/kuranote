"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { installToolbarProbe } from "../toolbarProbe";

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

export function ToolbarMetrics() {
  const output = useRef<HTMLOutputElement>(null);
  useEffect(() => {
    if (output.current) return installToolbarProbe(output.current);
  }, []);
  return <output hidden id="toolbar-probe" ref={output} />;
}
