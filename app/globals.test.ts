import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const globalCss = readFileSync(
  join(process.cwd(), "app", "globals.css"),
  "utf8",
);

describe("globals.css", () => {
  it("让文档画布与根容器保持全视口的用户主题背景", () => {
    expect(globalCss).toMatch(
      /html\s*\{[^}]*background-color:\s*var\(--user-theme-page-top-bg\)/,
    );
    expect(globalCss).toMatch(
      /body\s*\{[^}]*background-color:\s*var\(--user-theme-page-top-bg\)/,
    );
    expect(globalCss).toMatch(
      /html\s*\{[^}]*background-image:\s*var\(--user-theme-page-bg\)/,
    );
    expect(globalCss).toMatch(
      /body\s*\{[^}]*background-image:\s*var\(--user-theme-page-bg\)/,
    );
    expect(globalCss).toMatch(/#app-root\s*\{[^}]*min-height:\s*100dvh/);
  });

  it("使用环境安全区变量且不写死刘海高度", () => {
    const safeAreaDefinitions = globalCss.match(/:root\s*\{([^}]*)\}/)?.[1];

    expect(safeAreaDefinitions).toContain("env(safe-area-inset-top, 0px)");
    expect(safeAreaDefinitions).toContain("env(safe-area-inset-bottom, 0px)");
    expect(safeAreaDefinitions).not.toMatch(/(?:44|47|59)px/);
  });
});
