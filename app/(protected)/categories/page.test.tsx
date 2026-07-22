// @vitest-environment node

import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  getCategoriesView: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
}));

vi.mock("server/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
}));
vi.mock("server/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createServerRequestDependencies,
}));
vi.mock("server/container", () => ({
  createRequestContainer: mocks.createRequestContainer,
}));
vi.mock("server/category/adapter/next/actions", () => ({
  archiveCategory: vi.fn(),
  createCategory: vi.fn(),
  reorderCategories: vi.fn(),
  updateCategory: vi.fn(),
}));

import CategoriesRoute from "./page";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const userId = "00000000-0000-4000-8000-000000000031";

describe("CategoriesRoute SSR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUserAndLedger.mockResolvedValue({
      currentLedger: {
        currentUserRole: "owner",
        id: ledgerId,
        name: "家庭账本",
      },
      userId,
    });
    mocks.createServerRequestDependencies.mockResolvedValue({});
    mocks.getCategoriesView.mockResolvedValue({
      canManageCategories: true,
      categories: [],
      ledgerName: "家庭账本",
      parentOptions: [],
    });
    mocks.createRequestContainer.mockReturnValue({
      category: { service: { getCategoriesView: mocks.getCategoriesView } },
    });
  });

  it("直接调用 Category Service，不向自身 /api 发请求", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = (await CategoriesRoute({
      searchParams: Promise.resolve({}),
    })) as ReactElement;

    expect(mocks.getCategoriesView).toHaveBeenCalledWith({
      ledgerId,
      ledgerName: "家庭账本",
      userId,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.props).toMatchObject({
      canManageCategories: true,
      categories: [],
      ledgerName: "家庭账本",
      parentOptions: [],
    });

    fetchSpy.mockRestore();
  });
});
