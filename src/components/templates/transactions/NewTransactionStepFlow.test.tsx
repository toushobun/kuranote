import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MerchantEntrySuggestions } from "internal/transaction";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { receiptItemsOptions } from "test/mocks/transactionReceipt";
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
      categoryOptions={receiptItemsOptions.categoryOptions}
      frequentMerchants={[]}
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

// 没有常用商家时只有列表行，行名称带商家分类。
function selectMerchant(name: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${name}`) }));
}

function onMerchantScreen() {
  return !!screen.queryByRole("heading", { name: "记一笔" });
}
function paymentLine() {
  return screen.getByRole("button", { name: "更换支付账户 1" }).parentElement!;
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

  it("常用商家随页面数据传入，与全部商家同时显示且不在浏览器端另行请求", () => {
    setup({
      frequentMerchants: [{ merchantId: "seven", recordCount: 3 }],
    });
    expect(screen.getByRole("group", { name: "常用商家" })).toBeInTheDocument();
    expect(screen.getByText("全部商家")).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it("常用商家为空时不显示常用区块，仍可选择商家", async () => {
    setup();
    expect(screen.queryByText("常用商家")).not.toBeInTheDocument();
    selectMerchant("7-Eleven");
    respond("merchantId=seven", noHistory);
    expect(await screen.findByText("这家商家还没有记录")).toBeInTheDocument();
  });

  it("加载中点另一个商家时取消前一个，只采用当前商家的建议", async () => {
    setup();
    selectMerchant("7-Eleven");
    expect(requests.at(-1)?.url).toBe(
      "/api/transactions/merchant-entry-suggestions?ledgerId=ledger-1&merchantId=seven",
    );
    expect(onMerchantScreen()).toBe(true);
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
    expect(await screen.findByText("这家商家还没有记录")).toBeInTheDocument();
    // 7-Eleven 的建议晚到：不覆盖当前商家的建议，也不会自动选账户。
    respond("merchantId=seven", {
      ...noHistory,
      recommendedAccountIds: ["paypay"],
    });
    await Promise.resolve();
    expect(screen.getByText("这家商家还没有记录")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeInTheDocument();
    expect(paymentLine()).toHaveTextContent("选择收支账户");
  });

  it("当前商家的建议到达后走快速路线", async () => {
    setup();
    selectMerchant("7-Eleven");
    respond("merchantId=seven", {
      ...noHistory,
      recommendedAccountIds: ["paypay"],
    });

    await waitFor(() => expect(paymentLine()).toHaveTextContent("PayPay"));
  });

  it("建议获取失败时按没有记录处理，可以继续手动记账", async () => {
    setup();
    selectMerchant("7-Eleven");
    expect(onMerchantScreen()).toBe(true);
    respond("merchantId=seven", { error: {} }, 500);

    expect(await screen.findByText("这家商家还没有记录")).toBeInTheDocument();
    expect(paymentLine()).toHaveTextContent("选择收支账户");
    click("更换支付账户 1");
    expect(
      screen.getByText("这家商家还没有记录，按账户顺序显示"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "PayPay JPY" }));
    await waitFor(() => expect(paymentLine()).toHaveTextContent("PayPay"));
  });

  it("新建商家返回后直接进入小票并读取该商家的建议", async () => {
    setup({ initialMerchantId: "life" });
    expect(onMerchantScreen()).toBe(false);
    expect(
      screen.getByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeInTheDocument();
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
    fireEvent.click(
      await screen.findByRole("button", { name: "更换支付账户 1" }),
    );
    click("新增账户");
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
