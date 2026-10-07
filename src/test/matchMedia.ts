import { vi } from "vitest";

/**
 * 让 window.matchMedia 对所有查询返回固定结果（jsdom 未实现 matchMedia）。
 * 返回还原函数，在 afterEach 中调用。
 */
export function mockMatchMedia(matches: boolean) {
  const original = window.matchMedia;

  window.matchMedia = vi.fn((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
    matches,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  }));

  return () => {
    window.matchMedia = original;
  };
}
