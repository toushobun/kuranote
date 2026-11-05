import { setupGuardHistoryMock, backFromGuard } from "test/mockGuardHistory";
const guardHistory = setupGuardHistoryMock();
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { NewTransactionStepFlow } from "templates/transactions/NewTransactionStepFlow";
import { flowFixture } from "test/mocks/transactionStepFlow";
import { receiptItemsOptions } from "test/mocks/transactionReceipt";
import { routerMock } from "test/mocks/navigation";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { merchantErrorMessages } from "internal/merchant";
import { createMerchantPresetOptions } from "test/mocks/merchantPresets";
import type {
  MerchantPresetLoadAction,
  MerchantPresetLoadState,
} from "types/merchants";
import { MerchantPresetLauncher } from "./MerchantPresetLauncher";

const action = async () => ({});
function renderLauncher(
  loadAction: MerchantPresetLoadAction,
  onClose = vi.fn(),
) {
  return render(
    <MerchantPresetLauncher
      action={action}
      loadAction={loadAction}
      onClose={onClose}
    />,
  );
}
function createPendingLoad() {
  let resolve!: (value: MerchantPresetLoadState) => void;
  const loadAction = vi.fn(
    () =>
      new Promise<MerchantPresetLoadState>((done) => {
        resolve = done;
      }),
  );
  return {
    loadAction,
    resolve: (value: MerchantPresetLoadState) => resolve(value),
  };
}
describe("MerchantPresetLauncher", () => {
  it("读取期间显示加载状态，读取后显示精简选项", async () => {
    const { loadAction, resolve } = createPendingLoad();
    renderLauncher(loadAction);
    expect(screen.getByText("正在读取预设商家…")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "全部选择" }),
    ).not.toBeInTheDocument();
    await act(async () => resolve({ options: createMerchantPresetOptions() }));
    expect(screen.getByRole("button", { name: "全部选择" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "添加 0 个商家" }),
    ).toBeDisabled();
    expect(loadAction).toHaveBeenCalledOnce();
  });
  it("读取失败沿用 ActionFailureFeedback，关闭反馈保留当前地址", async () => {
    const loadAction = async () => ({
      error: merchantErrorMessages.merchant_preset_load_failed,
      errorKey: "load-1",
    });
    renderLauncher(loadAction);
    const originalHref = window.location.href;
    expect(await screen.findByRole("alert")).toHaveTextContent(
      merchantErrorMessages.merchant_preset_load_failed,
    );
    fireEvent.click(
      within(screen.getByRole("alert")).getByRole("button", { name: "关闭" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(window.location.href).toBe(originalHref);
  });
  it("调用异常使用权威安全文案，不显示原始网络错误", async () => {
    const loadAction = async () => {
      throw new Error("private network data");
    };
    renderLauncher(loadAction);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      merchantErrorMessages.merchant_preset_load_failed,
    );
    expect(screen.queryByText("private network data")).not.toBeInTheDocument();
  });
  it("读取中关闭后忽略旧响应，重新打开读取最新币种", async () => {
    const { loadAction: firstLoad, resolve } = createPendingLoad();
    const onClose = vi.fn();
    const { unmount } = renderLauncher(firstLoad, onClose);
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    const latestLoad = vi.fn(async () => ({
      options: {
        region: null,
        templateVersion: null,
        groups: [],
        items: [],
        addedKeys: [],
      },
    }));
    renderLauncher(latestLoad, onClose);
    expect(await screen.findByText("你主要在哪里生活？")).toBeInTheDocument();
    await act(async () => resolve({ options: createMerchantPresetOptions() }));
    expect(screen.getByRole("radio", { name: "日本" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "全部选择" }),
    ).not.toBeInTheDocument();
    expect(latestLoad).toHaveBeenCalledOnce();
  });
  it("预设提交先清理历史哨兵，失败后可继续留在弹层", async () => {
    const save = vi.fn(async () => {
      expect(guardHistory().index()).toBe(1);
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "base",
      );
      return { error: merchantErrorMessages.merchant_preset_add_failed };
    });
    render(
      <NewTransactionStepFlow
        action={action}
        accountOptions={flowFixture.accounts}
        addPresetsAction={save}
        categoryOptions={receiptItemsOptions.categoryOptions}
        frequentMerchants={[]}
        ledgerId="ledger-1"
        loadPresetsAction={async () => ({
          options: createMerchantPresetOptions(),
        })}
        merchantOptions={[]}
        merchantTags={[]}
        multiAccountPaymentEnabled
        transactionItemSpecialStatusEnabled={false}
      />,
      { wrapper: ConfirmDialogTestProviders },
    );
    fireEvent.click(screen.getByRole("button", { name: "从预设添加" }));
    fireEvent.click(await screen.findByRole("button", { name: "全部选择" }));
    fireEvent.click(screen.getByRole("button", { name: /添加 \d+ 个商家/ }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "sentinel",
      ),
    );
    expect(
      screen.getByRole("heading", { name: "从预设添加商家" }),
    ).toBeInTheDocument();
  });
  it("预设成功后原页不重挂载，进入小票修改仍拦截后退", async () => {
    routerMock.refresh.mockClear();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        automaticCategoryIds: [],
        quickAmounts: [],
        recommendedAccountIds: [],
      }),
    );
    const base = {
      action,
      accountOptions: flowFixture.accounts,
      addPresetsAction: async () => ({ success: "已添加 3 个商家" }),
      categoryOptions: receiptItemsOptions.categoryOptions,
      frequentMerchants: [],
      ledgerId: "ledger-1",
      loadPresetsAction: async () => ({
        options: createMerchantPresetOptions(),
      }),
      merchantTags: [],
      multiAccountPaymentEnabled: true,
      transactionItemSpecialStatusEnabled: false,
    };
    try {
      const view = render(
        <NewTransactionStepFlow {...base} merchantOptions={[]} />,
        { wrapper: ConfirmDialogTestProviders },
      );
      const heading = screen.getByRole("heading", { name: "记一笔" });
      fireEvent.click(screen.getByRole("button", { name: "从预设添加" }));
      fireEvent.click(await screen.findByRole("button", { name: "全部选择" }));
      fireEvent.click(screen.getByRole("button", { name: /添加 \d+ 个商家/ }));
      await waitFor(() => expect(routerMock.refresh).toHaveBeenCalledOnce());
      await waitFor(() =>
        expect(
          screen.queryByRole("heading", { name: "从预设添加商家" }),
        ).toBeNull(),
      );
      expect(screen.getByRole("heading", { name: "记一笔" })).toBe(heading);
      await waitFor(() => expect(guardHistory().index()).toBe(1));
      // 模拟 refresh 更新服务端选项：Next 抹掉当前记录的标记，但保留原客户端组件实例。
      guardHistory().nextReplaceState();
      view.rerender(
        <NewTransactionStepFlow
          {...base}
          merchantOptions={flowFixture.merchants}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /^7-Eleven/ }));
      await screen.findByText("这家商家还没有记录");
      await backFromGuard();
      expect(
        await screen.findByRole("dialog", { name: "尚未保存" }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
      );
    } finally {
      fetchMock.mockRestore();
    }
  });
  it.each([false, true])(
    "新增首屏的常用商家层加载完成为%s时后退只关最上层，前进不复活",
    async (loaded) => {
      routerMock.push.mockClear();
      const { loadAction, resolve } = createPendingLoad();
      render(
        <NewTransactionStepFlow
          action={action}
          accountOptions={flowFixture.accounts}
          addPresetsAction={action}
          categoryOptions={receiptItemsOptions.categoryOptions}
          frequentMerchants={[]}
          ledgerId="ledger-1"
          loadPresetsAction={loadAction}
          merchantOptions={[]}
          merchantTags={[]}
          multiAccountPaymentEnabled
          transactionItemSpecialStatusEnabled={false}
        />,
        { wrapper: ConfirmDialogTestProviders },
      );
      expect(window.history.pushState).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "从预设添加" }));
      if (loaded)
        await act(async () =>
          resolve({ options: createMerchantPresetOptions() }),
        );
      await screen.findByRole("heading", { name: "从预设添加商家" });
      await backFromGuard();
      await waitFor(() =>
        expect(
          screen.queryByRole("heading", { name: "从预设添加商家" }),
        ).toBeNull(),
      );
      expect(
        screen.getByRole("heading", { name: "记一笔" }),
      ).toBeInTheDocument();
      expect(routerMock.push).not.toHaveBeenCalled();
      expect(window.history.pushState).toHaveBeenCalledOnce();
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "base",
      );
      await act(async () => window.history.forward());
      expect(window.history.state?.kuranoteUnsavedChanges?.position).toBe(
        "base",
      );
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
    },
  );
});
