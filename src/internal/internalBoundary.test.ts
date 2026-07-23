// @vitest-environment node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { basename, extname, join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const internalRoot = join(repositoryRoot, "src", "internal");
const testFile = join(internalRoot, "internalBoundary.test.ts");
const ignoredDirectories = new Set([
  ".codegraph",
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  "coverage",
  "node_modules",
  "storybook-static",
]);
const textExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const forbiddenPathPatterns = [
  {
    name: "src/server 目录引用",
    pattern: /\bsrc[\\/]server(?:[\\/]|\b)/,
  },
  {
    name: "server 路径别名",
    pattern:
      /\bserver\/(?:account|appEnv|auth|category|container|db|db-types|ledger|merchant|moduleRegistry|router|serverModule|shared|statistics|transaction|user)\b/,
  },
  {
    name: "server 通配符别名",
    pattern: /["']server\/\*["']/,
  },
] as const;

function collectTextFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    if (ignoredDirectories.has(entry)) return [];

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectTextFiles(path);
    return textExtensions.has(extname(entry)) ? [path] : [];
  });
}

function isControllerFile(file: string): boolean {
  return (
    file.includes(`${sep}controller${sep}`) &&
    (file.endsWith(".ts") || file.endsWith(".tsx")) &&
    !file.endsWith(".test.ts") &&
    !file.endsWith(".test.tsx")
  );
}

function isModuleRouterFile(file: string): boolean {
  const fileName = basename(file);
  return fileName === "router.ts" || fileName.endsWith("Router.ts");
}

function parseNamedImports(importBody: string): string[] {
  return importBody
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(/\s+as\s+/).at(-1) ?? entry);
}

describe("internal backend boundary", () => {
  it("不再保留 src/server 目录", () => {
    expect(existsSync(join(repositoryRoot, "src", "server"))).toBe(false);
  });

  it("全仓库代码、配置与文档不再引用旧 server 路径", () => {
    const violations = collectTextFiles(repositoryRoot)
      .filter((file) => file !== testFile)
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        return forbiddenPathPatterns.flatMap(({ name, pattern }) =>
          pattern.test(source)
            ? [`${relative(repositoryRoot, file)}: ${name}`]
            : [],
        );
      });

    expect(violations).toEqual([]);
  });

  it("所有 Controller 都不再定义 createRoute", () => {
    const violations = collectTextFiles(internalRoot)
      .filter(isControllerFile)
      .filter((file) => readFileSync(file, "utf8").includes("createRoute("))
      .map((file) => relative(repositoryRoot, file));

    expect(violations).toEqual([]);
  });

  it("所有模块 Router 都在同一文件声明 Method、Path 与 Handler 绑定", () => {
    const routerFiles = collectTextFiles(internalRoot).filter((file) => {
      if (!isModuleRouterFile(file)) return false;
      return readFileSync(file, "utf8").includes("createRoute(");
    });

    expect(routerFiles.length).toBeGreaterThan(0);

    for (const routerFile of routerFiles) {
      const routerPath = relative(repositoryRoot, routerFile);
      const routerSource = readFileSync(routerFile, "utf8");
      const compactRouterSource = routerSource.replace(/\s/g, "");
      const routeNames = [
        ...routerSource.matchAll(/export const (\w+Route) = createRoute\(\{/g),
      ].map((match) => match[1]);
      const bindings = [
        ...compactRouterSource.matchAll(/\.openapi\((\w+Route),(\w+)/g),
      ].map((match) => ({ handlerName: match[2], routeName: match[1] }));
      const controllerHandlerImports = [
        ...routerSource.matchAll(
          /import\s*\{([\s\S]*?)\}\s*from\s*["'][^"']*\/controller\/[^"']+["'];/g,
        ),
      ].flatMap((match) => parseNamedImports(match[1]));

      expect(routeNames.length, routerPath).toBeGreaterThan(0);
      expect(
        bindings.map(({ routeName }) => routeName).sort(),
        `${routerPath}: Route Contract 必须且只能绑定一次`,
      ).toEqual([...routeNames].sort());

      for (const routeName of routeNames) {
        const declarationPattern = new RegExp(
          `export const ${routeName} = createRoute\\(\\{([\\s\\S]*?)\\n\\}\\);`,
        );
        const declaration = routerSource.match(declarationPattern)?.[1];

        expect(declaration, `${routerPath}:${routeName}`).toBeDefined();
        expect(declaration, `${routerPath}:${routeName}:method`).toMatch(
          /\bmethod:\s*["'][a-z]+["']/,
        );
        expect(declaration, `${routerPath}:${routeName}:path`).toMatch(
          /\bpath:\s*["'][^"']+["']/,
        );
      }

      for (const { handlerName, routeName } of bindings) {
        expect(
          controllerHandlerImports,
          `${routerPath}:${routeName} 必须绑定 Controller Handler`,
        ).toContain(handlerName);
      }
    }
  });
});
