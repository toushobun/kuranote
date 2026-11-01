import { vi } from "vitest";

import type { GuardHistoryPort } from "molecules/ui/UnsavedChangesDialog/unsavedChangesHistory";

/** 保留前进分支的内存历史；go 异步触发，避免同步 mock 掩盖重复遍历问题。 */
export function createGuardHistoryPort() {
  const entries: Array<ReturnType<GuardHistoryPort["state"]>> = [
    { previousPage: true },
    { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: "表单" } },
  ];
  let index = 1;
  let onPop = () => {};
  let position = { x: 0, y: 0 };
  let mode: ScrollRestoration = "auto";
  const port: GuardHistoryPort = {
    state: () => entries[index]!,
    href: () => (index === 0 ? "/previous" : "/edit"),
    replace: vi.fn((state) => {
      entries[index] = state;
    }),
    push: vi.fn((state) => {
      entries.splice(index + 1, entries.length, state);
      index++;
    }),
    go: vi.fn((delta) => {
      queueMicrotask(() => {
        index = Math.max(0, Math.min(entries.length - 1, index + delta));
        onPop();
      });
    }),
    scrollPosition: () => position,
    scrollTo: vi.fn((next) => {
      position = { x: next.x, y: next.y };
    }),
    scrollRestoration: () => mode,
    setScrollRestoration: vi.fn((next) => {
      mode = next;
    }),
    afterTraversal: (callback) => queueMicrotask(callback),
  };
  return {
    port,
    entries,
    index: () => index,
    onPop: (callback: () => void) => {
      onPop = callback;
    },
    flush: async () => {
      for (let i = 0; i < 20; i++) await Promise.resolve();
    },
  };
}
