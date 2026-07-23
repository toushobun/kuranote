// @vitest-environment node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative, sep } from "node:path";

import * as ts from "typescript";
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

function collectModuleSpecifiers(sourceFile: ts.SourceFile): string[] {
  return sourceFile.statements.flatMap((statement) => {
    if (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) {
      const moduleSpecifier = getModuleSpecifier(statement);
      return moduleSpecifier ? [moduleSpecifier] : [];
    }
    return [];
  });
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
      if (!declaration.initializer || !isCreateRouteCall(declaration.initializer)) {
        return [];
      }

      const config = declaration.initializer.arguments[0];
      if (!config || !ts.isObjectLiteralExpression(config)) {
        return [
          { method: null, name: declaration.name.text, path: null },
        ];
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
  return !subpath || subpath === "adapter/next" || subpath.startsWith("adapter/next/");
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
        const issues = hasCreateRouteCall(sourceFile) ? ["定义 createRoute"] : [];
        const routerImports = collectModuleSpecifiers(sourceFile).filter(
          (moduleSpecifier) => /(?:\/router|Router)$/.test(moduleSpecifier),
        );
        return [
          ...issues.map((issue) => `${filePath}: ${issue}`),
          ...routerImports.map(
            (moduleSpecifier) =>
              `${filePath}: 反向依赖 ${moduleSpecifier}`,
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
          .filter((moduleSpecifier) => !isAllowedExternalModuleImport(moduleSpecifier))
          .map(
            (moduleSpecifier) =>
              `${filePath}: 绕过模块入口 ${moduleSpecifier}`,
          );
      });

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
      const controllerHandlerImports = collectControllerHandlerImports(sourceFile);

      expect(routes.length, routerPath).toBeGreaterThan(0);
      expect(
        bindings.map(({ routeName }) => routeName).sort(),
        `${routerPath}: Route Contract 必须且只能绑定一次`,
      ).toEqual(routes.map(({ name }) => name).sort());

      for (const route of routes) {
        expect(route.method, `${routerPath}:${route.name}:method`).not.toBeNull();
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
