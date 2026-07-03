import type { ComponentProps } from "react";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  TransactionListItem,
  TransactionSearchPage,
} from "types/transactions";

import { TransactionSearchTemplate } from "./TransactionSearch";

type NextImageMockProps = ComponentProps<"img"> & {
  fill?: boolean;
};

const { routerReplaceMock } = vi.hoisted(() => ({
  routerReplaceMock: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ alt, fill, ...props }: NextImageMockProps) => (
    <img alt={alt} data-fill={fill ? "true" : undefined} {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}));

vi.mock("theme/UserThemeProvider", () => ({
  useUserTheme: () => ({
    themeKey: "amberWarmth",
  }),
}));

vi.mock("molecules/transactions/TransactionRow", () => ({
  TransactionRow: ({ item }: { item: TransactionListItem }) => (
    <div data-testid="transaction-row">
      {item.merchant_name ?? item.note ?? item.account_name}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const firstItem = createItem({
  id: "00000000-0000-4000-8000-000000009001",
  merchantName: "便利店",
});
const secondItem = createItem({
  id: "00000000-0000-4000-8000-000000009002",
  merchantName: "咖啡店",
});

function renderSearch({
  errorMessage = null,
  initialPage = { items: [firstItem], nextOffset: null, totalCount: 1 },
  initialQuery = "便利店",
  isLoading = false,
  loadSearchPageAction,
}: {
  errorMessage?: string | null;
  initialPage?: TransactionSearchPage;
  initialQuery?: string;
  isLoading?: boolean;
  loadSearchPageAction?: (
    query: string,
    offset: number,
  ) => Promise<TransactionSearchPage>;
} = {}) {
  return render(
    <TransactionSearchTemplate
      errorMessage={errorMessage}
      initialPage={initialPage}
      initialQuery={initialQuery}
      isLoading={isLoading}
      loadSearchPageAction={loadSearchPageAction}
    />,
  );
}

describe("TransactionSearchTemplate", () => {
  it("显示搜索框和搜索结果条数", () => {
    renderSearch();

    expect(screen.getByLabelText("搜索关键词")).toHaveValue("便利店");
    expect(screen.getByText("共 1 条结果")).toBeInTheDocument();
    expect(screen.getByText("便利店")).toBeInTheDocument();
  });

  it("结果列表不显示日期分组标题", () => {
    renderSearch();

    expect(screen.queryByText("2026年7月")).not.toBeInTheDocument();
    expect(screen.queryByText("7月1日（周三）")).not.toBeInTheDocument();
  });

  it("取消搜索返回明细页", () => {
    renderSearch();

    expect(screen.getByRole("link", { name: "取消" })).toHaveAttribute(
      "href",
      "/transactions",
    );
  });

  it("返回箭头返回明细页", () => {
    renderSearch();

    expect(screen.getByRole("link", { name: "返回明细页" })).toHaveAttribute(
      "href",
      "/transactions",
    );
  });

  it("提交关键词后更新搜索路由", () => {
    renderSearch();
    const input = screen.getByLabelText("搜索关键词");

    fireEvent.change(input, {
      target: { value: "咖啡 午餐" },
    });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(routerReplaceMock).toHaveBeenCalledWith(
      "/transactions/search?q=%E5%92%96%E5%95%A1+%E5%8D%88%E9%A4%90",
    );
  });

  it("清除按钮清空搜索词", () => {
    renderSearch();

    fireEvent.click(screen.getByRole("button", { name: "清除搜索词" }));

    expect(screen.getByLabelText("搜索关键词")).toHaveValue("");
    expect(routerReplaceMock).toHaveBeenCalledWith("/transactions/search");
  });

  it("清除搜索后忽略加载更多的旧响应", async () => {
    const deferredPage = createDeferred<TransactionSearchPage>();
    const loadSearchPageAction = vi.fn(() => deferredPage.promise);
    renderSearch({
      initialPage: { items: [firstItem], nextOffset: 20, totalCount: 2 },
      loadSearchPageAction,
    });

    fireEvent.click(screen.getByRole("button", { name: "加载更多" }));
    fireEvent.click(screen.getByRole("button", { name: "清除搜索词" }));

    expect(screen.getByText("输入关键词，快速查找流水")).toBeInTheDocument();

    await act(async () => {
      deferredPage.resolve({
        items: [secondItem],
        nextOffset: null,
        totalCount: 2,
      });
      await deferredPage.promise;
    });

    expect(screen.queryByText("咖啡店")).not.toBeInTheDocument();
    expect(screen.queryByText("共 2 条结果")).not.toBeInTheDocument();
  });

  it("没有关键词时显示搜索引导空态和插图", () => {
    renderSearch({
      initialPage: { items: [], nextOffset: null, totalCount: 0 },
      initialQuery: "",
    });

    expect(screen.getByText("输入关键词，快速查找流水")).toBeInTheDocument();
    expect(
      screen.getByText("支持按商家名、备注、金额、成员搜索"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("transaction-search-illustration-guide"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("搜索引导插图")).toHaveAttribute(
      "src",
      "/assets/kura-search/search_illustration_amber_warmth.png",
    );
  });

  it("无结果时显示搜索无结果空态和插图", () => {
    renderSearch({
      initialPage: { items: [], nextOffset: null, totalCount: 0 },
    });

    expect(screen.getByText("没有找到相关流水")).toBeInTheDocument();
    expect(screen.getByText("换个关键词试试看吧")).toBeInTheDocument();
    expect(
      screen.getByTestId("transaction-search-illustration-empty"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("搜索无结果插图")).toHaveAttribute(
      "src",
      "/assets/kura-search/empty_amber_warmth.png",
    );
  });

  it("结果项进入编辑页时保留搜索关键词", () => {
    renderSearch();

    const rowLink = screen.getByText("便利店").closest("a");

    expect(rowLink).toHaveAttribute(
      "href",
      "/transactions/00000000-0000-4000-8000-000000009001/edit?returnTo=%2Ftransactions%2Fsearch%3Fq%3D%25E4%25BE%25BF%25E5%2588%25A9%25E5%25BA%2597",
    );
  });

  it("读取更多结果", async () => {
    const loadSearchPageAction = vi.fn(async () => ({
      items: [secondItem],
      nextOffset: null,
      totalCount: 2,
    }));
    renderSearch({
      initialPage: { items: [firstItem], nextOffset: 20, totalCount: 2 },
      loadSearchPageAction,
    });

    fireEvent.click(screen.getByRole("button", { name: "加载更多" }));

    await waitFor(() => {
      expect(loadSearchPageAction).toHaveBeenCalledWith("便利店", 20);
      expect(screen.getByText("咖啡店")).toBeInTheDocument();
    });
  });

  it("读取失败时显示错误状态", () => {
    renderSearch({ errorMessage: "搜索结果读取失败，请稍后重新读取。" });

    expect(screen.getByText("搜索读取失败")).toBeInTheDocument();
    expect(
      screen.getByText("搜索结果读取失败，请稍后重新读取。"),
    ).toBeInTheDocument();
  });

  it("显示加载中状态", () => {
    renderSearch({ isLoading: true });

    expect(screen.getByText("搜索中...")).toBeInTheDocument();
  });
});

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

function createItem({
  id,
  merchantName,
}: {
  id: string;
  merchantName: string;
}): TransactionListItem {
  return {
    account_currency: "JPY",
    account_name: "三井住友银行",
    amount: "980",
    categoryItems: [
      {
        amount: "980",
        categoryName: "午餐",
        categoryType: "expense",
        parentCategoryName: "饮食",
      },
    ],
    created_at: "2026-07-01T10:00:00.000Z",
    id,
    merchant_icon_url: null,
    merchant_name: merchantName,
    note: null,
    recorder_name: "我",
    tagNames: ["日常"],
    transaction_at: "2026-07-01T10:00:00.000Z",
    type: "expense",
  };
}
