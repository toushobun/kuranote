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
        currency: "USD",
        templateVersion: null,
        groups: [],
        items: [],
        addedKeys: [],
      },
    }));
    renderLauncher(latestLoad, onClose);
    expect(await screen.findByText("暂无该币种的预设商家")).toBeInTheDocument();
    await act(async () => resolve({ options: createMerchantPresetOptions() }));
    expect(screen.getByText("已为你按 USD 准备常用商家")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "全部选择" }),
    ).not.toBeInTheDocument();
    expect(latestLoad).toHaveBeenCalledOnce();
  });
});
