import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative } from "node:path";

const repositoryRoot = process.cwd();
const oldRoot = join(repositoryRoot, "src", "server");
const newRoot = join(repositoryRoot, "src", "internal");

const routeGroups = [
  {
    controller: "src/internal/account/controller/accountController.ts",
    controllerModule: "internal/account/controller/accountController",
    router: "src/internal/account/router.ts",
    routerModule: "internal/account/router",
    schemaModule: "internal/account/schema",
  },
  {
    controller: "src/internal/auth/controller/authController.ts",
    controllerModule: "internal/auth/controller/authController",
    router: "src/internal/auth/router.ts",
    routerModule: "internal/auth/router",
    schemaModule: "internal/auth/schema",
  },
  {
    controller: "src/internal/category/controller/categoryController.ts",
    controllerModule: "internal/category/controller/categoryController",
    router: "src/internal/category/router.ts",
    routerModule: "internal/category/router",
    schemaModule: "internal/category/schema",
  },
  {
    controller: "src/internal/ledger/controller/ledgerInviteController.ts",
    controllerModule: "internal/ledger/controller/ledgerInviteController",
    router: "src/internal/ledger/router.ts",
    routerModule: "internal/ledger/router",
    schemaModule: "internal/ledger/schema",
  },
  {
    controller: "src/internal/ledger/controller/ledgerController.ts",
    controllerModule: "internal/ledger/controller/ledgerController",
    router: "src/internal/ledger/managementRouter.ts",
    routerModule: "internal/ledger/managementRouter",
    schemaModule: "internal/ledger/schema",
  },
  {
    controller: "src/internal/merchant/controller/merchantController.ts",
    controllerModule: "internal/merchant/controller/merchantController",
    router: "src/internal/merchant/router.ts",
    routerModule: "internal/merchant/router",
    schemaModule: "internal/merchant/schema",
  },
  {
    controller: "src/internal/statistics/controller/statisticsController.ts",
    controllerModule: "internal/statistics/controller/statisticsController",
    router: "src/internal/statistics/router.ts",
    routerModule: "internal/statistics/router",
    schemaModule: "internal/statistics/schema",
  },
  {
    controller: "src/internal/transaction/controller/transactionController.ts",
    controllerModule: "internal/transaction/controller/transactionController",
    router: "src/internal/transaction/router.ts",
    routerModule: "internal/transaction/router",
    schemaModule: "internal/transaction/schema",
  },
  {
    controller: "src/internal/user/controller/userController.ts",
    controllerModule: "internal/user/controller/userController",
    router: "src/internal/user/router.ts",
    routerModule: "internal/user/router",
    schemaModule: "internal/user/schema",
  },
];

const textExtensions = new Set([
  ".cjs",
  ".css",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".scss",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "node_modules",
  "storybook-static",
]);

function walk(directory) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;

    const absolutePath = join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...walk(absolutePath));
      continue;
    }

    if (textExtensions.has(extname(entry)) || entry === "AGENTS.md") {
      files.push(absolutePath);
    }
  }

  return files;
}

function replacePathReferences() {
  for (const file of walk(repositoryRoot)) {
    if (file.endsWith("package-lock.json")) continue;

    const original = readFileSync(file, "utf8");
    let updated = original.replaceAll("src/server", "src/internal");
    updated = updated.replaceAll('"server/', '"internal/');
    updated = updated.replaceAll("'server/", "'internal/");

    if (extname(file) === ".md" || extname(file) === ".txt") {
      updated = updated.replaceAll("`server/", "`internal/");
    }

    if (updated !== original) writeFileSync(file, updated, "utf8");
  }
}

function findStatement(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`找不到语句：${marker}`);

  const start = source.lastIndexOf("\n", markerIndex) + 1;
  let braces = 0;
  let brackets = 0;
  let parentheses = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") braces += 1;
    if (character === "}") braces -= 1;
    if (character === "[") brackets += 1;
    if (character === "]") brackets -= 1;
    if (character === "(") parentheses += 1;
    if (character === ")") parentheses -= 1;

    if (
      character === ";" &&
      braces === 0 &&
      brackets === 0 &&
      parentheses === 0
    ) {
      let end = index + 1;
      while (source[end] === "\n") end += 1;
      return { end, start, text: source.slice(start, index + 1) };
    }
  }

  throw new Error(`语句没有结束：${marker}`);
}

function findImport(source, moduleName) {
  const doubleNeedle = `from "${moduleName}";`;
  const singleNeedle = `from '${moduleName}';`;
  let needle = doubleNeedle;
  let moduleIndex = source.indexOf(doubleNeedle);

  if (moduleIndex < 0) {
    needle = singleNeedle;
    moduleIndex = source.indexOf(singleNeedle);
  }

  if (moduleIndex < 0) return null;

  const importIndex = source.lastIndexOf("import ", moduleIndex);
  if (importIndex < 0) throw new Error(`找不到 import 起点：${moduleName}`);

  let end = moduleIndex + needle.length;
  while (source[end] === "\n") end += 1;
  return { end, start: importIndex, text: source.slice(importIndex, end) };
}

function parseNamedImports(importText) {
  const open = importText.indexOf("{");
  const close = importText.lastIndexOf("}");
  if (open < 0 || close < 0) return [];

  return importText
    .slice(open + 1, close)
    .split(",")
    .map((name) => name.trim().replace(/^type\s+/, ""))
    .filter(Boolean);
}

function buildNamedImport(names, moduleName, typeOnly = false) {
  const keyword = typeOnly ? "import type" : "import";
  if (names.length === 1) {
    return `${keyword} { ${names[0]} } from "${moduleName}";\n`;
  }

  return `${keyword} {\n${names.map((name) => `  ${name},`).join("\n")}\n} from "${moduleName}";\n`;
}

function removeRange(source, range) {
  return `${source.slice(0, range.start)}${source.slice(range.end)}`;
}

function insertBeforeFirstExport(source, text) {
  const exportIndex = source.indexOf("export const ");
  if (exportIndex < 0) throw new Error("Router 中找不到 export const。");
  return `${source.slice(0, exportIndex)}${text.trim()}\n\n${source.slice(exportIndex)}`;
}

function moveRouteContracts(group) {
  const controllerPath = join(repositoryRoot, group.controller);
  const routerPath = join(repositoryRoot, group.router);
  let controller = readFileSync(controllerPath, "utf8");
  let router = readFileSync(routerPath, "utf8");

  const routeNames = [
    ...controller.matchAll(/export const (\w+Route) = createRoute\(/g),
  ].map((match) => match[1]);

  if (routeNames.length === 0) {
    throw new Error(`${group.controller} 中没有 createRoute 契约。`);
  }

  const routeStatements = routeNames.map((routeName) =>
    findStatement(controller, `export const ${routeName} = createRoute(`),
  );
  const errorResponses = controller.includes("const errorResponses =")
    ? findStatement(controller, "const errorResponses =")
    : null;
  const schemaImport = findImport(controller, group.schemaModule);

  if (!schemaImport) {
    throw new Error(`${group.controller} 中找不到 Schema import。`);
  }

  const movedBlocks = [
    ...(errorResponses ? [errorResponses.text] : []),
    ...routeStatements.map((statement) => statement.text),
  ].join("\n\n");

  const removals = [
    ...routeStatements,
    ...(errorResponses ? [errorResponses] : []),
    schemaImport,
  ].sort((left, right) => right.start - left.start);

  for (const range of removals) controller = removeRange(controller, range);

  controller = controller.replace(
    /import \{ createRoute, type RouteHandler \} from "@hono\/zod-openapi";\n/,
    'import type { RouteHandler } from "@hono/zod-openapi";\n',
  );

  const appEnvImport = findImport(controller, "internal/appEnv");
  if (!appEnvImport) throw new Error(`${group.controller} 中找不到 AppEnv import。`);
  controller = `${controller.slice(0, appEnvImport.end)}${buildNamedImport(
    routeNames,
    group.routerModule,
    true,
  )}${controller.slice(appEnvImport.end)}`;

  router = router.replace(
    'import { OpenAPIHono } from "@hono/zod-openapi";',
    'import { createRoute, OpenAPIHono } from "@hono/zod-openapi";',
  );

  const controllerImport = findImport(router, group.controllerModule);
  if (!controllerImport) {
    throw new Error(`${group.router} 中找不到 Controller import。`);
  }

  const handlerNames = parseNamedImports(controllerImport.text).filter(
    (name) => !routeNames.includes(name),
  );
  router = `${router.slice(0, controllerImport.start)}${buildNamedImport(
    handlerNames,
    group.controllerModule,
  )}${schemaImport.text}${router.slice(controllerImport.end)}`;
  router = insertBeforeFirstExport(router, movedBlocks);

  writeFileSync(controllerPath, controller, "utf8");
  writeFileSync(routerPath, router, "utf8");

  return { ...group, routeNames };
}

function rewriteRouteImports(groups) {
  const files = walk(join(repositoryRoot, "src"));

  for (const file of files) {
    if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;

    let source = readFileSync(file, "utf8");
    let changed = false;

    for (const group of groups) {
      if (relative(repositoryRoot, file) === group.router) continue;
      if (relative(repositoryRoot, file) === group.controller) continue;

      const controllerImport = findImport(source, group.controllerModule);
      if (!controllerImport) continue;

      const names = parseNamedImports(controllerImport.text);
      const moved = names.filter((name) => group.routeNames.includes(name));
      if (moved.length === 0) continue;

      const kept = names.filter((name) => !group.routeNames.includes(name));
      const replacement = `${
        kept.length > 0
          ? buildNamedImport(kept, group.controllerModule)
          : ""
      }${buildNamedImport(moved, group.routerModule)}`;

      source = `${source.slice(0, controllerImport.start)}${replacement}${source.slice(
        controllerImport.end,
      )}`;
      changed = true;
    }

    if (changed) writeFileSync(file, source, "utf8");
  }
}

function renameInternalModuleContract() {
  const oldPath = join(newRoot, "serverModule.ts");
  const newPath = join(newRoot, "internalModule.ts");
  if (existsSync(oldPath)) renameSync(oldPath, newPath);

  for (const file of walk(repositoryRoot)) {
    if (file.endsWith("package-lock.json")) continue;

    const original = readFileSync(file, "utf8");
    let updated = original.replaceAll(
      "internal/serverModule",
      "internal/internalModule",
    );
    updated = updated.replaceAll("ServerModule", "InternalModule");
    updated = updated.replaceAll("serverModules", "internalModules");
    updated = updated.replace(/\bserverModule\b/g, "internalModule");

    if (updated !== original) writeFileSync(file, updated, "utf8");
  }
}

function addBoundaryTest() {
  const testPath = join(newRoot, "internalBoundary.test.ts");
  const content = `// @vitest-environment node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const testFile = join(repositoryRoot, "src", "internal", "internalBoundary.test.ts");
const sourceRoots = [".github", ".storybook", "app", "scripts", "src", "tests"];
const sourceExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx", ".yml", ".yaml"]);
const forbiddenAliasPatterns = [
  /from\\s+["']server\\//,
  /import\\(\\s*["']server\\//,
  /(?:vi|jest)\\.mock\\(\\s*["']server\\//,
  /["']server\\/\\*["']/,
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
`;

  writeFileSync(testPath, content, "utf8");
}

function removeBootstrapFiles() {
  for (const path of [
    "issue-500-inventory.txt",
    "issue-500-bootstrap-note.txt",
    "issue-500-bootstrap-note-2.txt",
    ".github/workflows/issue-500-bootstrap.yml",
  ]) {
    rmSync(join(repositoryRoot, path), { force: true, recursive: true });
  }
}

if (!existsSync(oldRoot)) {
  throw new Error("src/server 不存在，无法执行 Issue #500 迁移。");
}
if (existsSync(newRoot)) {
  throw new Error("src/internal 已存在，拒绝覆盖。");
}

mkdirSync(dirname(newRoot), { recursive: true });
renameSync(oldRoot, newRoot);
replacePathReferences();
const movedGroups = routeGroups.map(moveRouteContracts);
rewriteRouteImports(movedGroups);
renameInternalModuleContract();
addBoundaryTest();
removeBootstrapFiles();

const staleImports = walk(repositoryRoot)
  .filter((file) => !file.endsWith("package-lock.json"))
  .flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return source.includes('"server/') || source.includes("'server/")
      ? [relative(repositoryRoot, file)]
      : [];
  });

if (staleImports.length > 0) {
  throw new Error(`仍存在 server 路径别名：\n${staleImports.join("\n")}`);
}

console.log("Issue #500 目录和路由契约迁移完成。");
