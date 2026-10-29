import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createMerchantPresetOptions } from "test/mocks/merchantPresets";
import type {
  MerchantActionState,
  MerchantPresetStateAction,
} from "types/merchants";
import { MerchantPresetDialog } from "./MerchantPresetDialog";

function renderDialog(
  action: MerchantPresetStateAction = async () => ({}),
  options = createMerchantPresetOptions(),
  returnTo?: string,
) {
  const onClose = vi.fn();
  render(
    <MerchantPresetDialog
      action={action}
      onClose={onClose}
      options={options}
      returnTo={returnTo}
    />,
  );
  return { options, onClose };
}
describe("MerchantPresetDialog", () => {
  it("初始数量为零，添加按钮禁用；全部选择排除已添加且只提交去重 key", async () => {
    const action = vi.fn<MerchantPresetStateAction>().mockResolvedValue({});
    const options = createMerchantPresetOptions();
    options.addedKeys = [options.items[0]!.key];
    renderDialog(action, options);
    expect(
      screen.getByRole("button", { name: "添加 0 个商家" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "全部选择" }));
    fireEvent.click(screen.getByRole("button", { name: "添加 2 个商家" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const form = action.mock.calls[0]![1];
    expect(form.getAll("selectedKeys")).toEqual(
      options.items.slice(1).map(({ key }) => key),
    );
    expect(form.get("currency")).toBe("JPY");
    expect(form.get("templateVersion")).toBe("1");
    expect(form.get("name")).toBeNull();
    expect(form.get("returnTo")).toBeNull();
  });
  it("从记一笔打开时提交返回路径", async () => {
    const action = vi.fn<MerchantPresetStateAction>().mockResolvedValue({});
    renderDialog(action, createMerchantPresetOptions(), "/transactions/new");
    fireEvent.click(screen.getByRole("button", { name: "全部选择" }));
    fireEvent.click(screen.getByRole("button", { name: /^添加 \d+ 个商家$/ }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0]![1].get("returnTo")).toBe("/transactions/new");
  });
  it("提交期间按钮、勾选与关闭锁定，仍可展开查看，禁止重复提交", async () => {
    let resolve!: (value: MerchantActionState) => void;
    const action = vi.fn<MerchantPresetStateAction>(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const { onClose, options } = renderDialog(action);
    fireEvent.click(screen.getByRole("button", { name: "全部选择" }));
    fireEvent.click(screen.getByRole("button", { name: "添加 3 个商家" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "关闭" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "添加中…" })).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: options.groups[0]!.name,
      }),
    ).toBeEnabled();
    fireEvent.click(
      screen.getByRole("button", { name: options.groups[0]!.name }),
    );
    expect(
      screen.getByRole("button", { name: options.groups[0]!.name }),
    ).toHaveAttribute("aria-expanded", "true");
    for (const box of screen.getAllByRole("checkbox"))
      expect(box).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => resolve({}));
  });
  it("无模板显示空状态与现有手动新增地址", () => {
    renderDialog(undefined, {
      currency: "USD",
      templateVersion: null,
      groups: [],
      items: [],
      addedKeys: [],
    });
    expect(screen.getByText("暂无该币种的预设商家")).toBeInTheDocument();
    expect(screen.getByText("可以先手动添加商家")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "手动添加" })).toHaveAttribute(
      "href",
      "/merchants/new",
    );
    expect(
      screen.getByRole("button", { name: "添加 0 个商家" }),
    ).toBeDisabled();
  });
  it("提交失败复用失败反馈并保留本次选择", async () => {
    renderDialog(async () => ({
      error: "添加失败，请重试",
      errorKey: "retry-1",
    }));
    fireEvent.click(screen.getByRole("button", { name: "全部选择" }));
    fireEvent.click(screen.getByRole("button", { name: "添加 3 个商家" }));
    expect(await screen.findByText("添加失败，请重试")).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("alert")).getByRole("button", { name: "关闭" }),
    );
    expect(
      await screen.findByRole("button", { name: "添加 3 个商家" }),
    ).toBeEnabled();
  });
});
