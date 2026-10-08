"use client";

import { useRouter } from "next/navigation";

// 可一次清除多个参数，避免连续 replace 时后一次读到旧 URL 而把前一个参数写回。
export function useClearQueryParam(...paramNames: [string, ...string[]]) {
  const router = useRouter();

  return function clearQueryParam() {
    const url = new URL(window.location.href);
    for (const paramName of paramNames) {
      url.searchParams.delete(paramName);
    }
    router.replace(`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    });
  };
}
