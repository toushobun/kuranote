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
const routeModules = [
  ["account/router.ts", "account/controller/accountController.ts"],
  ["auth/router.ts", "auth/controller/authController.ts"],
  ["category/router.ts", "category/controller/categoryController.ts"],
  ["ledger/router.ts", "ledger/controller/ledgerInviteController.ts"],
  ["ledger/managementRouter.ts", "ledger/controller/ledgerController.ts"],
  ["merchant/router.ts", "merchant/controller/merchantController.ts"],
  ["statistics/router.ts", "statistics/controller/statisticsController.ts"],
  ["transaction/router.ts", "transaction/controller/transactionController.ts"],
  ["user/router.ts", "user/controller/userController.ts"],
] as const;

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

  it("模块 Router 同时声明 Method、Path 与 Controller Handler 绑定", () => {
    for (const [routerPath, controllerPath] of routeModules) {
      const routerSource = readFileSync(
        join(repositoryRoot, "src", "internal", routerPath),
        "utf8",
      );
      const controllerSource = readFileSync(
        join(repositoryRoot, "src", "internal", controllerPath),
        "utf8",
      );
      const compactRouterSource = routerSource.replace(/\s/g, "");
      const routeNames = [
        ...routerSource.matchAll(/export const (\w+Route) = createRoute\(\{/g),
      ].map((match) => match[1]);

      expect(routeNames.length, routerPath).toBeGreaterThan(0);
      expect(controllerSource, controllerPath).not.toContain("createRoute(");

      for (const routeName of routeNames) {
        const handlerName = routeName.replace(/Route$/, "Handler");
        const routeContractPattern = new RegExp(
          `export const ${routeName} = createRoute\\(\\{[\\s\\S]*?method:\\s*["'][a-z]+["'][\\s\\S]*?path:\\s*["'][^"']+["']`,
        );
        const routeBindingPattern = new RegExp(
          `\\.openapi\\(${routeName},${handlerName},?\\)`,
        );

        expect(routerSource, `${routerPath}:${routeName}`).toMatch(
          routeContractPattern,
        );
        expect(compactRouterSource, `${routerPath}:${routeName}`).toMatch(
          routeBindingPattern,
        );
      }
    }
  });
});
