import {
  act,
  cleanup,
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
) {
  const onClose = vi.fn();
  render(
    <MerchantPresetDialog
      action={action}
      onClose={onClose}
      options={options}
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
    expect(screen.getByText("本次按日本常用商家推荐")).toBeInTheDocument();
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
    expect(form.getAll("regions")).toEqual(["jp"]);
    expect(form.get("templateVersion")).toBe("2");
    expect(form.get("name")).toBeNull();
  });
  it.each(["jp", null] as const)(
    "临时更改地区后重新打开仍使用账本地区：%s",
    (region) => {
      const options = { ...createMerchantPresetOptions(), region };
      const action = vi.fn<MerchantPresetStateAction>().mockResolvedValue({});
      renderDialog(action, options);
      if (region) fireEvent.click(screen.getByRole("button", { name: "更改" }));
      fireEvent.click(screen.getByRole("radio", { name: "中国" }));
      expect(screen.getByText("本次按中国常用商家推荐")).toBeInTheDocument();
      expect(action).not.toHaveBeenCalled();
      cleanup();
      renderDialog(action, options);
      if (region) {
        expect(screen.getByText("本次按日本常用商家推荐")).toBeInTheDocument();
      } else {
        expect(screen.getByRole("radio", { name: "日本" })).not.toBeChecked();
        expect(screen.getByRole("radio", { name: "中国" })).not.toBeChecked();
      }
    },
  );
  it("内嵌预设成功后通知父层刷新", async () => {
    const saved = vi.fn();
    const save = vi.fn<MerchantPresetStateAction>().mockResolvedValue({
      success: "已添加 3 个商家",
    });
    render(
      <MerchantPresetDialog
        action={save}
        onClose={vi.fn()}
        onSaved={saved}
        options={createMerchantPresetOptions()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "全部选择" }));
    fireEvent.click(screen.getByRole("button", { name: "添加 3 个商家" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]![1].get("presentation")).toBe("dialog");
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
      region: null,
      templateVersion: null,
      groups: [],
      items: [],
      addedKeys: [],
    });
    expect(screen.getByText("你主要在哪里生活？")).toBeInTheDocument();
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
