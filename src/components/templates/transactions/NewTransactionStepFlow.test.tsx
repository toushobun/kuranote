import { setupGuardHistoryMock, backFromGuard } from "test/mockGuardHistory";
const guardHistory = setupGuardHistoryMock({ trackUrls: true });

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MerchantEntrySuggestions } from "internal/transaction";
import {
  ReceiptCreationTestProviders,
  submitReceiptCreation,
} from "test/receiptCreation";
import { selectEntryMerchant } from "test/transactionStepFlow";
import {
  expectNoPaymentRow,
  expectSuggestionsLoadingRows,
  pressItemAmountKey,
} from "test/transactionConfirmStep";
import { saveAndLeaveField } from "config/unsavedChanges";
import { receiptItemsOptions } from "test/mocks/transactionReceipt";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { NewTransactionStepFlow } from "./NewTransactionStepFlow";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock(
  "organisms/merchants/MerchantPresetLauncher/MerchantPresetLauncher",
  () => ({
    MerchantPresetLauncher: () => <div data-testid="preset-launcher" />,
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

const emptySuggestions: MerchantEntrySuggestions = {
  automaticCategoryIds: [],
  quickAmounts: [],
  recommendedAccountIds: [],
};

function setup(
  overrides: Partial<Parameters<typeof NewTransactionStepFlow>[0]> = {},
) {
  window.history.replaceState(
    window.history.state,
    "",
    overrides.initialMethod === "transfer"
      ? "/transactions/new?method=transfer"
      : "/transactions/new",
  );
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
    { wrapper: ReceiptCreationTestProviders },
  );
}

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

// 切换方式时经 history.replaceState 同步的地址。
function replacedUrls() {
  return vi
    .mocked(window.history.replaceState)
    .mock.calls.map(([, , url]) => url);
}

function paymentLine() {
  return screen.getByRole("button", { name: "更换支付账户 1" }).parentElement!;
}

async function switchMethod(name: "账户周转" | "从商家记账") {
  click("切换方式");
  click(name);
  await screen.findByRole("heading", { name });
  expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
}

async function updateNote(previous: string, note: string) {
  click(`修改备注：${previous}`);
  fireEvent.change(screen.getByRole("textbox", { name: "备注" }), {
    target: { value: note },
  });
  click("完成");
  await screen.findByRole("button", {
    name: `修改备注：${note || "添加备注"}`,
  });
}

async function chooseTransferAccount(side: "转出" | "转入", account: string) {
  click(`更换${side}账户：选择账户`);
  fireEvent.click(screen.getByRole("radio", { name: `${account} JPY` }));
  await screen.findByRole("button", { name: `更换${side}账户：${account}` });
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
    click("修改商家：请选择商家");
    expect(screen.getByRole("group", { name: "常用商家" })).toBeInTheDocument();
    expect(screen.getByText("全部商家")).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it("常用商家为空时不显示常用区块，仍可选择商家", async () => {
    setup();
    click("修改商家：请选择商家");
    expect(screen.queryByText("常用商家")).not.toBeInTheDocument();
    await selectEntryMerchant(/^7-Eleven/);
    respond("merchantId=seven", emptySuggestions);
    await screen.findByRole("button", { name: "添加付款账户" });
  });

  it("加载中点另一个商家时取消前一个，只采用当前商家的建议", async () => {
    setup();
    await selectEntryMerchant(/^7-Eleven/);
    expect(requests.at(-1)?.url).toBe(
      "/api/transactions/merchant-entry-suggestions?ledgerId=ledger-1&merchantId=seven",
    );
    expectSuggestionsLoadingRows(true);
    await selectEntryMerchant(/^LIFE超市/, "7-Eleven");
    expectSuggestionsLoadingRows(true);
    expect(
      screen.getByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "修改商家：7-Eleven" }),
    ).not.toBeInTheDocument();
    expect(
      requests.find((request) => request.url.includes("merchantId=seven"))
        ?.signal?.aborted,
    ).toBe(true);

    respond("merchantId=life", emptySuggestions);
    await screen.findByRole("button", { name: "添加付款账户" });
    expectSuggestionsLoadingRows(false);
    // 7-Eleven 的建议晚到：不覆盖当前商家的建议，也不会自动选账户。
    respond("merchantId=seven", {
      ...emptySuggestions,
      recommendedAccountIds: ["paypay"],
    });
    await Promise.resolve();
    expect(
      screen.getByRole("button", { name: "修改商家：LIFE超市" }),
    ).toBeInTheDocument();
    expectNoPaymentRow();
  });

  it("当前商家的建议到达后走快速路线", async () => {
    setup();
    await selectEntryMerchant(/^7-Eleven/);
    respond("merchantId=seven", {
      ...emptySuggestions,
      recommendedAccountIds: ["paypay"],
    });

    await waitFor(() => expect(paymentLine()).toHaveTextContent("PayPay"));
  });

  it("建议获取失败时按没有记录处理，可以继续手动记账", async () => {
    setup();
    await selectEntryMerchant(/^7-Eleven/);
    expectSuggestionsLoadingRows(true);
    respond("merchantId=seven", { error: {} }, 500);

    await screen.findByRole("button", { name: "添加付款账户" });
    expectSuggestionsLoadingRows(false);
    expectNoPaymentRow();
    click("添加付款账户");
    fireEvent.click(screen.getByRole("radio", { name: "PayPay JPY" }));
    await waitFor(() => expect(paymentLine()).toHaveTextContent("PayPay"));
  });

  it("搜索不到时在当前页新增并预填商家名称，保存后选中", async () => {
    setup();
    click("修改商家：请选择商家");
    fireEvent.change(screen.getByLabelText("搜索商家"), {
      target: { value: "全家" },
    });
    click("新增商家“全家”");
    expect(screen.getByLabelText(/商家名称/)).toHaveValue("全家");
    await submitReceiptCreation("merchant", "全家");
    respond("merchantId=new-merchant", emptySuggestions);
    expect(
      await screen.findByRole("button", { name: "修改商家：全家" }),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("新增账户后选中发起的付款行并保留小票", async () => {
    setup({ accountOptions: [] });
    await selectEntryMerchant(/^7-Eleven/);
    respond("merchantId=seven", emptySuggestions);
    fireEvent.click(
      await screen.findByRole("button", { name: "添加付款账户" }),
    );
    click("新增账户");
    await submitReceiptCreation("account", "新账户");
    await screen.findByRole("button", { name: "更换支付账户 1" });
    expect(paymentLine()).toHaveTextContent("新账户");
    expect(
      screen.getByRole("button", { name: "修改商家：7-Eleven" }),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("没有商家时从预设添加在当前页面打开", () => {
    setup({ merchantOptions: [] });
    click("修改商家：请选择商家");
    click("从预设添加");
    expect(screen.getByTestId("preset-launcher")).toBeInTheDocument();
  });

  it("空小票未修改时后退返回来源页，不压哨兵、不 push 明细页", async () => {
    setup();
    await act(async () => window.history.back());
    expect(guardHistory().index()).toBe(0);
    expect(window.history.back).toHaveBeenCalledOnce();
    expect(window.history.pushState).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });
  it("小票修改后后退可继续编辑，放弃只真正后退一次且不 push", async () => {
    setup();
    await selectEntryMerchant(/^7-Eleven/);
    respond("merchantId=seven", emptySuggestions);
    await screen.findByRole("button", { name: "添加付款账户" });
    // #1016：只选商家不是修改，先手动选择付款账户再验证未保存守卫。
    click("添加付款账户");
    fireEvent.click(screen.getByRole("radio", { name: "PayPay JPY" }));
    await waitFor(() =>
      expect(screen.queryByRole("radiogroup", { name: "收支账户" })).toBeNull(),
    );
    window.scrollTo(0, 2000);
    await backFromGuard();
    await screen.findByRole("dialog", { name: "尚未保存" });
    click("继续编辑");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
    );
    expect(window.scrollY).toBe(2000);
    expect(guardHistory().index()).toBe(2);
    await backFromGuard();
    click("放弃修改");
    await waitFor(() => expect(guardHistory().index()).toBe(0));
    expect(window.history.back).toHaveBeenCalledTimes(3);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("空小票无修改时关闭直接回到明细列表", async () => {
    setup();
    click("关闭记账");
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/transactions"),
    );
  });

  it("切换方式只在浏览器端换成转账小票并替换地址，后退一次离开记一笔", async () => {
    setup();
    click("切换方式");
    await waitFor(() => expect(guardHistory().index()).toBe(2));
    click("账户周转");
    expect(
      await screen.findByRole("heading", { name: "账户周转" }),
    ).toBeInTheDocument();
    // 两种方式共用同一个外框（#1055），切换时不另开弹框。
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
    expect(replacedUrls()).toContain("/transactions/new?method=transfer");
    await waitFor(() => expect(guardHistory().index()).toBe(1));
    expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe("base");
    await act(async () => window.history.back());
    expect(guardHistory().index()).toBe(0);
  });

  it("从账户周转切回从商家记账，显示空小票", async () => {
    setup({ initialMethod: "transfer" });
    expect(screen.getByRole("heading", { name: "账户周转" })).toBeVisible();
    click("切换方式");
    click("从商家记账");
    expect(
      await screen.findByRole("heading", { name: "从商家记账" }),
    ).toBeVisible();
    expect(replacedUrls()).toContain("/transactions/new");
  });

  it("双向切换保留各自草稿", async () => {
    setup();
    await selectEntryMerchant(/^7-Eleven/);
    respond("merchantId=seven", emptySuggestions);
    await updateNote("添加备注", "商家草稿");
    await switchMethod("账户周转");
    await chooseTransferAccount("转出", "现金");
    await switchMethod("从商家记账");
    expect(
      screen.getByRole("button", { name: "修改商家：7-Eleven" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "修改备注：商家草稿" }),
    ).toBeVisible();
    await switchMethod("账户周转");
    expect(
      screen.getByRole("button", { name: "更换转出账户：现金" }),
    ).toBeVisible();
  });

  it("保存并退出只提交当前方式的表单", async () => {
    const action = vi.fn(async (_: unknown, data: FormData) => {
      expect(data.get(saveAndLeaveField)).toBe("true");
      expect(data.get("type")).toBe("transfer");
      expect(data.get("accountId")).toBe("cash");
      expect(data.get("transferTargetAccountId")).toBe("paypay");
      expect(data.get("transferAmount")).toBe("50");
      expect(data.get("note")).not.toBe("商家草稿");
      return { success: "已保存" };
    });
    setup({ action });
    await updateNote("添加备注", "商家草稿");
    await switchMethod("账户周转");
    await chooseTransferAccount("转出", "现金");
    await chooseTransferAccount("转入", "PayPay");
    click("修改转账金额：待输入");
    pressItemAmountKey("5");
    pressItemAmountKey("0");
    pressItemAmountKey("确定");
    await screen.findByRole("button", { name: "修改转账金额：¥50" });
    click("关闭记账");
    await screen.findByRole("dialog", { name: "尚未保存" });
    click("保存并退出");
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/transactions"),
    );
    expect(action).toHaveBeenCalledOnce();
  });

  it("只有隐藏草稿动过且已还原，当前小票后退和关闭也会确认", async () => {
    setup();
    await updateNote("添加备注", "改了又还原");
    await updateNote("改了又还原", "");
    await switchMethod("账户周转");
    const hidden = screen.getByTestId("wizard-dialog-switch-pane-merchant");
    expect(hidden).toHaveAttribute("inert");
    expect(hidden).toHaveAttribute("aria-hidden", "true");
    await backFromGuard();
    await screen.findByRole("dialog", { name: "尚未保存" });
    click("继续编辑");
    await screen.findByRole("heading", { name: "账户周转" });
    click("关闭记账");
    await screen.findByRole("dialog", { name: "尚未保存" });
    expect(router.push).not.toHaveBeenCalled();
    click("放弃修改");
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/transactions"),
    );
  });
});
