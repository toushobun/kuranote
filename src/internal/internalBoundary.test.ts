// @vitest-environment node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const sourceRoot = join(repositoryRoot, "src");
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
const sourceExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const businessModules = new Set([
  "account",
  "auth",
  "category",
  "ledger",
  "merchant",
  "statistics",
  "transaction",
  "user",
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

type RouteDeclaration = {
  method: string | null;
  name: string;
  path: string | null;
};

type RouteBinding = {
  handlerName: string;
  routeName: string;
};

function collectFiles(directory: string, extensions: Set<string>): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    if (ignoredDirectories.has(entry)) return [];

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectFiles(path, extensions);
    return extensions.has(extname(entry)) ? [path] : [];
  });
}

function createSourceFile(file: string): ts.SourceFile {
  const extension = extname(file);
  const scriptKind =
    extension === ".tsx" || extension === ".jsx"
      ? ts.ScriptKind.TSX
      : extension === ".js" || extension === ".mjs" || extension === ".cjs"
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;

  return ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
}

function isControllerFile(file: string): boolean {
  return (
    file.includes(`${sep}controller${sep}`) &&
    !file.endsWith(".test.ts") &&
    !file.endsWith(".test.tsx")
  );
}

function isModuleRouterFile(file: string): boolean {
  const fileName = basename(file);
  return fileName === "router.ts" || fileName.endsWith("Router.ts");
}

function getModuleSpecifier(
  declaration: ts.ImportDeclaration | ts.ExportDeclaration,
): string | null {
  return declaration.moduleSpecifier &&
    ts.isStringLiteralLike(declaration.moduleSpecifier)
    ? declaration.moduleSpecifier.text
    : null;
}

/**
 * 把 "@/..." 别名和 src 内的相对路径 import 归一化为 src 相对路径，
 * 避免边界检查因为 import 写法不同（而非实际指向不同）而被绕过。
 */
function normalizeModuleSpecifier(
  moduleSpecifier: string,
  containingFile: string,
): string {
  if (moduleSpecifier.startsWith("@/")) {
    return moduleSpecifier.slice("@/".length);
  }

  if (moduleSpecifier.startsWith(".")) {
    const resolved = resolve(dirname(containingFile), moduleSpecifier);
    if (
      resolved !== sourceRoot &&
      !resolved.startsWith(`${sourceRoot}${sep}`)
    ) {
      return moduleSpecifier;
    }
    return relative(sourceRoot, resolved).split(sep).join("/");
  }

  return moduleSpecifier;
}

function collectDynamicImportSpecifiers(sourceFile: ts.SourceFile): string[] {
  const specifiers: string[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const [source] = node.arguments;
      if (source && ts.isStringLiteralLike(source)) {
        specifiers.push(source.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function collectModuleSpecifiers(sourceFile: ts.SourceFile): string[] {
  const staticSpecifiers = sourceFile.statements.flatMap((statement) => {
    if (
      ts.isImportDeclaration(statement) ||
      ts.isExportDeclaration(statement)
    ) {
      const moduleSpecifier = getModuleSpecifier(statement);
      return moduleSpecifier ? [moduleSpecifier] : [];
    }
    return [];
  });
  const allSpecifiers = [
    ...staticSpecifiers,
    ...collectDynamicImportSpecifiers(sourceFile),
  ];

  return allSpecifiers.map((moduleSpecifier) =>
    normalizeModuleSpecifier(moduleSpecifier, sourceFile.fileName),
  );
}

function isCreateRouteCall(node: ts.Node): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "createRoute"
  );
}

function hasCreateRouteCall(sourceFile: ts.SourceFile): boolean {
  let found = false;

  function visit(node: ts.Node) {
    if (isCreateRouteCall(node)) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

function getPropertyString(
  objectLiteral: ts.ObjectLiteralExpression,
  propertyName: string,
): string | null {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = ts.isIdentifier(property.name)
      ? property.name.text
      : ts.isStringLiteralLike(property.name)
        ? property.name.text
        : null;
    if (name !== propertyName) continue;
    return ts.isStringLiteralLike(property.initializer)
      ? property.initializer.text
      : null;
  }
  return null;
}

function collectRouteDeclarations(
  sourceFile: ts.SourceFile,
): RouteDeclaration[] {
  return sourceFile.statements.flatMap((statement) => {
    if (!ts.isVariableStatement(statement)) return [];
    const isExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!isExported) return [];

    return statement.declarationList.declarations.flatMap((declaration) => {
      if (!ts.isIdentifier(declaration.name)) return [];
      if (!declaration.name.text.endsWith("Route")) return [];
      if (
        !declaration.initializer ||
        !isCreateRouteCall(declaration.initializer)
      ) {
        return [];
      }

      const config = declaration.initializer.arguments[0];
      if (!config || !ts.isObjectLiteralExpression(config)) {
        return [{ method: null, name: declaration.name.text, path: null }];
      }

      return [
        {
          method: getPropertyString(config, "method"),
          name: declaration.name.text,
          path: getPropertyString(config, "path"),
        },
      ];
    });
  });
}

function collectRouteBindings(sourceFile: ts.SourceFile): RouteBinding[] {
  const bindings: RouteBinding[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "openapi"
    ) {
      const [route, handler] = node.arguments;
      if (ts.isIdentifier(route) && ts.isIdentifier(handler)) {
        bindings.push({
          handlerName: handler.text,
          routeName: route.text,
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return bindings;
}

function collectControllerHandlerImports(sourceFile: ts.SourceFile): string[] {
  return sourceFile.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement)) return [];
    const moduleSpecifier = getModuleSpecifier(statement);
    if (!moduleSpecifier?.includes("/controller/")) return [];
    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) return [];
    return namedBindings.elements.map((element) => element.name.text);
  });
}

function isAllowedExternalModuleImport(moduleSpecifier: string): boolean {
  const match = moduleSpecifier.match(/^internal\/([^/]+)(?:\/(.+))?$/);
  if (!match || !businessModules.has(match[1])) return true;
  const subpath = match[2];
  return (
    !subpath ||
    subpath === "adapter/next" ||
    subpath.startsWith("adapter/next/")
  );
}

function isAdapterNextFile(file: string): boolean {
  return /^[^/]+\/adapter\/next(?:\/|$)/.test(
    relative(internalRoot, file).split(sep).join("/"),
  );
}

function collectImportViolations(
  files: string[],
  isForbidden: (moduleSpecifier: string, file: string) => boolean,
): string[] {
  return files.flatMap((file) => {
    const filePath = relative(repositoryRoot, file);
    return collectModuleSpecifiers(createSourceFile(file))
      .filter((moduleSpecifier) => isForbidden(moduleSpecifier, file))
      .map((moduleSpecifier) => `${filePath}: 禁止依赖 ${moduleSpecifier}`);
  });
}

describe("internal backend boundary", () => {
  it("不再保留 src/server 目录", () => {
    expect(existsSync(join(repositoryRoot, "src", "server"))).toBe(false);
  });

  it("全仓库代码、配置与文档不再引用旧 server 路径", () => {
    const violations = collectFiles(repositoryRoot, textExtensions)
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

  it("Controller 不定义 createRoute，也不反向依赖 Router", () => {
    const violations = collectFiles(internalRoot, sourceExtensions)
      .filter(isControllerFile)
      .flatMap((file) => {
        const sourceFile = createSourceFile(file);
        const filePath = relative(repositoryRoot, file);
        const issues = hasCreateRouteCall(sourceFile)
          ? ["定义 createRoute"]
          : [];
        const routerImports = collectModuleSpecifiers(sourceFile).filter(
          (moduleSpecifier) => /(?:\/router|Router)$/.test(moduleSpecifier),
        );
        return [
          ...issues.map((issue) => `${filePath}: ${issue}`),
          ...routerImports.map(
            (moduleSpecifier) => `${filePath}: 反向依赖 ${moduleSpecifier}`,
          ),
        ];
      });

    expect(violations).toEqual([]);
  });

  it("模块外代码只通过模块根入口或 adapter/next 访问业务模块", () => {
    const violations = collectFiles(repositoryRoot, sourceExtensions)
      .filter((file) => !file.startsWith(`${internalRoot}${sep}`))
      .flatMap((file) => {
        const filePath = relative(repositoryRoot, file);
        return collectModuleSpecifiers(createSourceFile(file))
          .filter(
            (moduleSpecifier) =>
              !isAllowedExternalModuleImport(moduleSpecifier),
          )
          .map(
            (moduleSpecifier) => `${filePath}: 绕过模块入口 ${moduleSpecifier}`,
          );
      });

    expect(violations).toEqual([]);
  });

  it("模块内 adapter/next 不深导入本模块 Service 或 Repository 实现", () => {
    // Current Ledger Context 必须先从请求认证 claims 确认用户及可访问账本，之后才能建立依赖已确认认证态的 RequestContainer。
    // 因此该请求初始化入口需要直接构造本模块 Repository；这是架构先后关系，不是一般性的 adapter 便捷豁免。
    const allowlist = new Set(["ledger/adapter/next/currentLedgerContext.ts"]);
    const files = collectFiles(internalRoot, sourceExtensions).filter(
      (file) =>
        isAdapterNextFile(file) &&
        !allowlist.has(relative(internalRoot, file).split(sep).join("/")),
    );
    const violations = collectImportViolations(
      files,
      (moduleSpecifier, file) => {
        const [moduleName] = relative(internalRoot, file).split(sep);
        const servicePath = `internal/${moduleName}/service`;
        const repositoryPath = `internal/${moduleName}/repository`;

        return (
          moduleSpecifier === servicePath ||
          moduleSpecifier.startsWith(`${servicePath}/`) ||
          moduleSpecifier === repositoryPath ||
          moduleSpecifier.startsWith(`${repositoryPath}/`)
        );
      },
    );

    expect(violations).toEqual([]);
  });

  it("adapter/next 以外的 internal 代码不依赖前端 types", () => {
    const files = collectFiles(internalRoot, sourceExtensions).filter(
      (file) => !isAdapterNextFile(file),
    );
    const violations = collectImportViolations(
      files,
      (moduleSpecifier) =>
        moduleSpecifier === "types" || moduleSpecifier.startsWith("types/"),
    );

    expect(violations).toEqual([]);
  });

  it("internal 代码不重新依赖旧 ledger 路径", () => {
    const violations = collectImportViolations(
      collectFiles(internalRoot, sourceExtensions),
      (moduleSpecifier) =>
        moduleSpecifier === "lib/ledger" ||
        (moduleSpecifier.startsWith("lib/ledger/") &&
          moduleSpecifier !== "lib/ledger/inviteToken"),
    );

    expect(violations).toEqual([]);
  });

  it("旧 Supabase 文件保持删除且 internal 代码不重新依赖其路径", () => {
    expect(existsSync(join(sourceRoot, "lib", "supabase", "server.ts"))).toBe(
      false,
    );
    expect(
      existsSync(join(sourceRoot, "lib", "supabase", "serviceRole.ts")),
    ).toBe(false);

    const violations = collectImportViolations(
      collectFiles(internalRoot, sourceExtensions),
      (moduleSpecifier) =>
        /^lib\/supabase\/(?:server|serviceRole)(?:$|[./])/.test(
          moduleSpecifier,
        ),
    );

    expect(violations).toEqual([]);
  });

  it("所有模块 Router 都在同一文件声明 Method、Path 与 Handler 绑定", () => {
    const routerFiles = collectFiles(internalRoot, sourceExtensions).filter(
      (file) => {
        if (!isModuleRouterFile(file)) return false;
        return hasCreateRouteCall(createSourceFile(file));
      },
    );

    expect(routerFiles.length).toBeGreaterThan(0);

    for (const routerFile of routerFiles) {
      const routerPath = relative(repositoryRoot, routerFile);
      const sourceFile = createSourceFile(routerFile);
      const routes = collectRouteDeclarations(sourceFile);
      const bindings = collectRouteBindings(sourceFile);
      const controllerHandlerImports =
        collectControllerHandlerImports(sourceFile);

      expect(routes.length, routerPath).toBeGreaterThan(0);
      expect(
        bindings.map(({ routeName }) => routeName).sort(),
        `${routerPath}: Route Contract 必须且只能绑定一次`,
      ).toEqual(routes.map(({ name }) => name).sort());

      for (const route of routes) {
        expect(
          route.method,
          `${routerPath}:${route.name}:method`,
        ).not.toBeNull();
        expect(route.path, `${routerPath}:${route.name}:path`).not.toBeNull();
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
