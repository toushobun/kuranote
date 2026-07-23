// @vitest-environment node

import { describe, expect, it } from "vitest";

import * as accountRoutes from "internal/account/router";
import * as authRoutes from "internal/auth/router";
import * as categoryRoutes from "internal/category/router";
import * as ledgerManagementRoutes from "internal/ledger/router";
import * as ledgerInviteRoutes from "internal/ledger/inviteRouter";
import * as merchantRoutes from "internal/merchant/router";
import { internalModules } from "internal/moduleRegistry";
import { apiRouter } from "internal/router";
import * as statisticsRoutes from "internal/statistics/router";
import * as transactionRoutes from "internal/transaction/router";
import * as userRoutes from "internal/user/router";

type RouteContract = {
  method: string;
  path: string;
};

type RouteNamespace = Record<string, unknown>;

type RouteSpec = {
  basePath: string;
  expectedRoutes: Record<string, RouteContract>;
  moduleName: string;
  namespace: RouteNamespace;
};

const routeSpecs: RouteSpec[] = [
  {
    basePath: "/ledgers",
    expectedRoutes: {
      archiveAccountRoute: {
        method: "delete",
        path: "/{ledgerId}/accounts/{accountId}",
      },
      createAccountRoute: {
        method: "post",
        path: "/{ledgerId}/accounts",
      },
      getAccountsRoute: {
        method: "get",
        path: "/{ledgerId}/accounts",
      },
      updateAccountRoute: {
        method: "patch",
        path: "/{ledgerId}/accounts/{accountId}",
      },
    },
    moduleName: "account",
    namespace: accountRoutes,
  },
  {
    basePath: "/auth",
    expectedRoutes: {
      checkRegisterEmailAvailabilityRoute: {
        method: "post",
        path: "/register/email-availability",
      },
      getSessionRoute: { method: "get", path: "/session" },
      loginRoute: { method: "post", path: "/login" },
      logoutRoute: { method: "delete", path: "/session" },
      registerRoute: { method: "post", path: "/register" },
      requestRegisterOtpRoute: {
        method: "post",
        path: "/register/otp/request",
      },
      startGoogleAuthRoute: {
        method: "post",
        path: "/oauth/google/start",
      },
      submitRegisterOtpRoute: {
        method: "post",
        path: "/register/otp/verify",
      },
    },
    moduleName: "auth",
    namespace: authRoutes,
  },
  {
    basePath: "/categories",
    expectedRoutes: {
      archiveCategoryRoute: {
        method: "delete",
        path: "/{ledgerId}/{categoryId}",
      },
      createCategoryRoute: { method: "post", path: "/{ledgerId}" },
      reorderCategoriesRoute: {
        method: "put",
        path: "/{ledgerId}/order",
      },
      updateCategoryRoute: {
        method: "patch",
        path: "/{ledgerId}/{categoryId}",
      },
    },
    moduleName: "category",
    namespace: categoryRoutes,
  },
  {
    basePath: "/ledger-invites",
    expectedRoutes: {
      acceptLedgerInviteRoute: { method: "post", path: "/accept" },
    },
    moduleName: "ledger-invites",
    namespace: ledgerInviteRoutes,
  },
  {
    basePath: "/ledgers",
    expectedRoutes: {
      createLedgerInviteRoute: {
        method: "post",
        path: "/{ledgerId}/invites",
      },
      createLedgerRoute: { method: "post", path: "/" },
      listPendingLedgerInvitesRoute: {
        method: "get",
        path: "/{ledgerId}/invites",
      },
      revokeLedgerInviteRoute: {
        method: "delete",
        path: "/{ledgerId}/invites/{inviteId}",
      },
      switchCurrentLedgerRoute: { method: "post", path: "/current" },
      updateLedgerSettingsRoute: {
        method: "patch",
        path: "/{ledgerId}/settings",
      },
    },
    moduleName: "ledger",
    namespace: ledgerManagementRoutes,
  },
  {
    basePath: "/merchants",
    expectedRoutes: {
      archiveMerchantAliasRoute: {
        method: "delete",
        path: "/aliases/{aliasId}",
      },
      archiveMerchantRoute: { method: "delete", path: "/{merchantId}" },
      createMerchantAliasRoute: {
        method: "post",
        path: "/{merchantId}/aliases",
      },
      createMerchantRoute: { method: "post", path: "/" },
      listMerchantOptionsRoute: { method: "get", path: "/options" },
      listMerchantsRoute: { method: "get", path: "/" },
      updateMerchantRoute: { method: "patch", path: "/{merchantId}" },
    },
    moduleName: "merchant",
    namespace: merchantRoutes,
  },
  {
    basePath: "/statistics",
    expectedRoutes: {
      getDashboardRoute: {
        method: "get",
        path: "/{ledgerId}/dashboard",
      },
      getStatisticsRoute: { method: "get", path: "/{ledgerId}" },
    },
    moduleName: "statistics",
    namespace: statisticsRoutes,
  },
  {
    basePath: "/transactions",
    expectedRoutes: {
      convertTransactionRoute: {
        method: "post",
        path: "/{transactionRecordId}/conversion",
      },
      createTransactionRoute: { method: "post", path: "/" },
      updateTransactionRoute: {
        method: "patch",
        path: "/{transactionRecordId}",
      },
      voidTransactionRoute: {
        method: "delete",
        path: "/{transactionRecordId}",
      },
    },
    moduleName: "transaction",
    namespace: transactionRoutes,
  },
  {
    basePath: "/users",
    expectedRoutes: {
      getCurrentUserProfileRoute: { method: "get", path: "/me" },
      updateCurrentUserProfileRoute: { method: "patch", path: "/me" },
    },
    moduleName: "user",
    namespace: userRoutes,
  },
];

const httpMethods = new Set([
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "trace",
]);

function extractRouteContracts(
  namespace: RouteNamespace,
): Record<string, RouteContract> {
  return Object.fromEntries(
    Object.entries(namespace)
      .filter(([name]) => name.endsWith("Route"))
      .map(([name, value]) => {
        expect(value, name).toBeTypeOf("object");
        const route = value as Partial<RouteContract>;
        expect(route.method, `${name}.method`).toBeTypeOf("string");
        expect(route.path, `${name}.path`).toBeTypeOf("string");
        return [name, { method: route.method, path: route.path }];
      }),
  ) as Record<string, RouteContract>;
}

function normalizePath(path: string): string {
  const normalized = path.replace(/\/{2,}/g, "/");
  return normalized.length > 1 && normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
}

function toRouteKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

describe("internal route registry", () => {
  it("Module Registry 保持既有模块顺序与 basePath", () => {
    expect(
      internalModules.map(({ basePath, name }) => ({ basePath, name })),
    ).toEqual([
      { basePath: "/auth", name: "auth" },
      { basePath: "/ledgers", name: "ledger" },
      { basePath: "/ledger-invites", name: "ledger-invites" },
      { basePath: "/ledgers", name: "account" },
      { basePath: "/categories", name: "category" },
      { basePath: "/merchants", name: "merchant" },
      { basePath: "/transactions", name: "transaction" },
      { basePath: "/statistics", name: "statistics" },
      { basePath: "/users", name: "user" },
    ]);
  });

  it("所有 Route Contract 保持既有 Method 与相对 Path", () => {
    for (const { expectedRoutes, moduleName, namespace } of routeSpecs) {
      expect(extractRouteContracts(namespace), moduleName).toEqual(
        expectedRoutes,
      );
    }
  });

  it("OpenAPI 文档保持最终 Method 与完整 URL", () => {
    const document = apiRouter.getOpenAPIDocument({
      info: { title: "KuraNote API", version: "test" },
      openapi: "3.0.0",
    });
    const actualRoutes = Object.entries(document.paths ?? {})
      .flatMap(([path, pathItem]) =>
        Object.keys(pathItem ?? {})
          .filter((method) => httpMethods.has(method))
          .map((method) => toRouteKey(method, path)),
      )
      .sort();
    const expectedRoutes = routeSpecs
      .flatMap(({ basePath, expectedRoutes }) =>
        Object.values(expectedRoutes).map(({ method, path }) =>
          toRouteKey(method, `/api${basePath}${path}`),
        ),
      )
      .sort();

    expect(actualRoutes).toEqual(expectedRoutes);
  });
});
