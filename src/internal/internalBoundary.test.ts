// @vitest-environment node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const testFile = join(
  repositoryRoot,
  "src",
  "internal",
  "internalBoundary.test.ts",
);
const sourceRoots = [".github", ".storybook", "app", "scripts", "src", "tests"];
const sourceExtensions = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
]);
const forbiddenAliasPatterns = [
  /from\s+["']server\//,
  /import\(\s*["']server\//,
  /(?:vi|jest)\.mock\(\s*["']server\//,
  /["']server\/\*["']/,
];

function collectFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectFiles(path);
    return sourceExtensions.has(extname(entry)) ? [path] : [];
  });
}

describe("internal backend boundary", () => {
  it("不再保留 src/server 目录", () => {
    expect(existsSync(join(repositoryRoot, "src", "server"))).toBe(false);
  });

  it("代码与配置不再使用 server 路径别名", () => {
    const violations = sourceRoots
      .flatMap((root) => collectFiles(join(repositoryRoot, root)))
      .filter((file) => file !== testFile)
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        return forbiddenAliasPatterns.some((pattern) => pattern.test(source))
          ? [relative(repositoryRoot, file)]
          : [];
      });

    expect(violations).toEqual([]);
  });
});
