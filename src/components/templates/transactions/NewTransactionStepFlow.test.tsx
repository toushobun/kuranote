import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MerchantEntrySuggestions } from "internal/transaction";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { itemsStepFixture } from "test/mocks/transactionItemsStep";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { NewTransactionStepFlow } from "./NewTransactionStepFlow";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock(
  "organisms/merchants/MerchantPresetLauncher/MerchantPresetLauncher",
  () => ({
    MerchantPresetLauncher: ({ returnTo }: { returnTo?: string | null }) => (
      <div data-return-to={returnTo} data-testid="preset-launcher" />
    ),
  }),
);

type Deferred = {
  resolve: (response: Response) => void;
  signal?: AbortSignal;
  url: string;
};
let requests: Deferred[] = [];

function respond(path: string, body: unknown, status = 200) {
  const request = requests.find((item) => item.url.includes(path));
  if (!request) throw new Error(`没有请求 ${path}`);
  requests = requests.filter((item) => item !== request);
  request.resolve(Response.json(body, { status }));
}

const noHistory: MerchantEntrySuggestions = {
  automaticCategoryIds: [],
  quickAmounts: [],
  recommendedAccountIds: [],
};

function setup(
  overrides: Partial<Parameters<typeof NewTransactionStepFlow>[0]> = {},
) {
  return render(
    <NewTransactionStepFlow
      action={async () => ({})}
      accountOptions={flowFixture.accounts}
      addPresetsAction={async () => ({})}
      categoryOptions={itemsStepFixture.categoryOptions}
      ledgerId="ledger-1"
      loadPresetsAction={async () => ({})}
      merchantOptions={flowFixture.merchants}
      merchantTags={flowFixture.merchantTags}
      multiAccountPaymentEnabled
      transactionItemSpecialStatusEnabled={false}
      {...overrides}
    />,
    { wrapper: ConfirmDialogTestProviders },
  );
}

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

// 常用商家未到达时只有列表行，行名称带商家分类。
function selectMerchant(name: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
}

function currentStep() {
  return within(screen.getByRole("list", { name: "记账进度" }))
    .getAllByRole("listitem")
    .findIndex((item) => item.dataset.status === "current");
}

describe("NewTransactionStepFlow", () => {
  beforeEach(() => {
    requests = [];
    router.push.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (url: string, init?: RequestInit) =>
          new Promise<Response>((resolve) =>
            requests.push({ resolve, signal: init?.signal ?? undefined, url }),
          ),
      ),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("常用商家异步到达前先显示全部商家，到达后显示常用区块", async () => {
    setup();
    expect(screen.getByText("全部商家")).toBeInTheDocument();
    expect(screen.queryByText("常用商家")).not.toBeInTheDocument();
    expect(requests[0]?.url).toBe(
      "/api/transactions/frequent-merchants?ledgerId=ledger-1",
    );

    respond("frequent-merchants", [{ merchantId: "seven", recordCount: 3 }]);

    expect(
      await screen.findByRole("group", { name: "常用商家" }),
    ).toBeInTheDocument();
  });

  it("常用商家读取失败时不显示常用区块，仍可选择商家", async () => {
    setup();
    respond("frequent-merchants", { error: {} }, 500);
    selectMerchant("7-Eleven");
    respond("merchantId=seven", noHistory);
    expect(
      await screen.findByRole("radiogroup", { name: "收支账户" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("常用商家")).not.toBeInTheDocument();
  });

  it("加载中点另一个商家时取消前一个，只采用当前商家的建议", async () => {
    setup();
    selectMerchant("7-Eleven");
    expect(requests.at(-1)?.url).toBe(
      "/api/transactions/merchant-entry-suggestions?ledgerId=ledger-1&merchantId=seven",
    );
    expect(currentStep()).toBe(0);
    selectMerchant("LIFE超市");
    expect(
      screen.getByRole("progressbar", { name: "正在读取 LIFE超市 的记录" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("progressbar", { name: "正在读取 7-Eleven 的记录" }),
    ).not.toBeInTheDocument();
    expect(
      requests.find((request) => request.url.includes("merchantId=seven"))
        ?.signal?.aborted,
    ).toBe(true);

    respond("merchantId=life", noHistory);
    expect(
      await screen.findByText("这家商家还没有记录，按账户顺序显示"),
    ).toBeInTheDocument();
    // 7-Eleven 的建议晚到：不覆盖当前商家的建议，也不会让流程跳到明细。
    respond("merchantId=seven", {
      ...noHistory,
      recommendedAccountIds: ["paypay"],
    });
    await Promise.resolve();
    expect(
      screen.getByText("这家商家还没有记录，按账户顺序显示"),
    ).toBeInTheDocument();
    expect(currentStep()).toBe(1);
  });

  it("当前商家的建议到达后走快速路线", async () => {
    setup();
    selectMerchant("7-Eleven");
    respond("merchantId=seven", {
      ...noHistory,
      recommendedAccountIds: ["paypay"],
    });

    await waitFor(() => expect(currentStep()).toBe(2));
  });

  it("建议获取失败时按没有记录处理，可以继续手动记账", async () => {
    setup();
    selectMerchant("7-Eleven");
    expect(currentStep()).toBe(0);
    respond("merchantId=seven", { error: {} }, 500);

    expect(
      await screen.findByText("这家商家还没有记录，按账户顺序显示"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "PayPay JPY" }));
    await waitFor(() => expect(currentStep()).toBe(2));
  });

  it("新建商家返回后预选商家并读取该商家的建议", async () => {
    setup({ initialMerchantId: "life", initialStep: 2 });
    expect(currentStep()).toBe(1);
    expect(
      requests.some((request) => request.url.includes("merchantId=life")),
    ).toBe(true);
  });

  it("搜索不到时新增商家带上关键词并返回从商家记账", () => {
    setup();
    fireEvent.change(screen.getByLabelText("搜索商家"), {
      target: { value: "全家" },
    });
    click("新增商家“全家”");
    expect(router.push).toHaveBeenCalledWith(
      "/merchants/new?name=%E5%85%A8%E5%AE%B6&returnTo=%2Ftransactions%2Fnew",
    );
  });

  it("新增账户时带着当前商家返回", async () => {
    setup({ accountOptions: [] });
    selectMerchant("7-Eleven");
    respond("merchantId=seven", noHistory);
    fireEvent.click(await screen.findByRole("button", { name: "新增账户" }));
    expect(router.push).toHaveBeenCalledWith(
      "/accounts?create=1&returnTo=%2Ftransactions%2Fnew%3FmerchantId%3Dseven",
    );
  });

  it("没有商家时从预设添加在当前页面打开，添加后返回记一笔", () => {
    setup({ merchantOptions: [] });
    click("从预设添加");
    expect(screen.getByTestId("preset-launcher")).toHaveAttribute(
      "data-return-to",
      "/transactions/new",
    );
  });

  it("关闭并确认放弃后回到明细列表", async () => {
    setup();
    click("关闭记账");
    click("放弃");
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/transactions"),
    );
  });

  it("切换方式时替换为对应方式的地址", () => {
    setup();
    click("切换方式");
    click("账户周转");
    expect(router.replace).toHaveBeenCalledWith(
      "/transactions/new?method=transfer",
    );
  });
});
