"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * 切换到另一个页面（pathname 变化）后，把窗口滚回顶部（#895）。
 *
 * Next.js 16.2.6 只在「第一个变化的 segment」顶部不在视口内时才滚动，实测以下情况不会回到顶部：
 * - 新页面 segment 的第一个 DOM 节点是 React 提升到 <head> 的 script / style，滚动处理直接放弃；
 * - 新页面先渲染较矮的 loading 骨架，滚动位置被压缩后判定为「顶部已可见」而不滚动；
 * 随后内容变高时，浏览器的滚动锚定会把页面继续往下推。
 *
 * 浏览器前进 / 后退（popstate）交给浏览器恢复原滚动位置，不在这里处理。
 * 只比较 pathname：同一页面内仅 query 变化（如 `?result=`、`scroll: false` 的 replace）
 * 或 revalidate 后留在原页面时，保持 Next.js 原有行为。
 */
export function useScrollTopOnPathnameChange() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  // 记录 popstate 到达的 pathname，用来区分前进 / 后退与普通跳转。
  const traversalPathname = useRef<string | null>(null);

  useEffect(() => {
    function recordTraversal() {
      traversalPathname.current = window.location.pathname;
    }
    window.addEventListener("popstate", recordTraversal);
    return () => window.removeEventListener("popstate", recordTraversal);
  }, []);

  // 在 Next.js 自带的滚动处理之后、浏览器绘制之前执行，避免先闪现偏移位置。
  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    const isTraversal = traversalPathname.current === pathname;
    traversalPathname.current = null;
    if (isTraversal) return;
    window.scrollTo({ left: 0, top: 0, behavior: "instant" });
  }, [pathname]);
}
