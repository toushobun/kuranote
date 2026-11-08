import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const protectedRoot = join(process.cwd(), "app", "(protected)");
const isolatedPages = [
  "accounts",
  "ledgers",
  "merchants",
  "settings",
  "settings/data",
  "transactions",
];

describe("受保护页面的加载边界", () => {
  it.each(isolatedPages)("/%s 的骨架与页面共用独立路由组", (route) => {
    const pageGroup = join(protectedRoot, route, "(index)");
    expect(existsSync(join(pageGroup, "page.tsx"))).toBe(true);
    expect(existsSync(join(pageGroup, "loading.tsx"))).toBe(true);
  });

  it("页面骨架不会包住同级入口下的子页面", () => {
    const files = readdirSync(protectedRoot, {
      recursive: true,
      encoding: "utf8",
    });
    const loadingDirs = files
      .filter((file) => basename(file) === "loading.tsx")
      .map(dirname)
      .filter((dir) => existsSync(join(protectedRoot, dir, "page.tsx")));
    const nestedPages = files.filter((file) => {
      if (basename(file) !== "page.tsx") return false;
      const pageDir = dirname(file);
      return loadingDirs.some((loadingDir) => {
        const path = relative(loadingDir, pageDir);
        return path !== "" && path !== ".." && !path.startsWith(".." + sep);
      });
    });
    expect(nestedPages).toEqual([]);
  });
});
