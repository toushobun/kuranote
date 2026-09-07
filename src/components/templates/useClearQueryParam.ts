"use client";

import { useRouter } from "next/navigation";

export function useClearQueryParam(paramName: string) {
  const router = useRouter();

  return function clearQueryParam() {
    const url = new URL(window.location.href);
    url.searchParams.delete(paramName);
    router.replace(`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    });
  };
}
