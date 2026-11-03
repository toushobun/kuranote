import { afterEach, beforeEach, describe, vi } from "vitest";

/**
 * 在模拟的不同运行环境默认 locale 下执行同一组用例。未指定 locale 的
 * localeCompare 按模拟值比较，因此不依赖本机 locale 也能发现排序随环境变化。
 */
export function describeAcrossDefaultLocales(
  name: string,
  suite: () => void,
): void {
  describe.each(["en", "ja-JP"])(`${name}（默认 locale 为 %s）`, (locale) => {
    beforeEach(() => {
      const { localeCompare } = String.prototype;

      vi.spyOn(String.prototype, "localeCompare").mockImplementation(function (
        this: string,
        that: string,
        locales?: Intl.LocalesArgument,
        options?: Intl.CollatorOptions,
      ) {
        return localeCompare.call(this, that, locales ?? locale, options);
      });
    });

    afterEach(() => {
      vi.mocked(String.prototype.localeCompare).mockRestore();
    });

    suite();
  });
}
