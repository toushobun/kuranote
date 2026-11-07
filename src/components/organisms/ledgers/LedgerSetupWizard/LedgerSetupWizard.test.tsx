import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { setupGuardHistoryMock } from "test/mockGuardHistory";
import { mockIntlTimeZone } from "test/mockIntlTimeZone";
import {
  createLedgerSetupConfirmProgressFixture,
  createLedgerSetupProgressFixture,
} from "test/mocks/ledgerSetup";
import {
  clickCloseWizard,
  clickCompleteSetup,
  clickNext,
  clickPrevious,
  completeSetupAndWait,
  createPersistMock,
  getCurrentStepItem,
  renderLedgerSetupWizard,
} from "./ledgerSetupWizardTestUtils";

setupGuardHistoryMock();
beforeEach(() => mockIntlTimeZone("Asia/Tokyo"));
afterEach(() => vi.restoreAllMocks());

function expectStep(label: string) {
  expect(getCurrentStepItem()).toHaveTextContent(label);
}

function clickExit(action: "保存并退出" | "放弃修改" | "继续编辑") {
  fireEvent.click(screen.getByRole("button", { name: action }));
}

describe("LedgerSetupWizard 本地草稿", () => {
  it("首次创建直达确认页不写库，确认页展示未持久化的账本名", async () => {
    const actions = renderLedgerSetupWizard();
    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "旅行账本" },
    });
    clickNext();
    expectStep("账户");
    clickNext();
    expectStep("商家");
    clickNext();
    expectStep("功能");
    clickNext();
    expectStep("确认");
    expect(
      screen.getByText("以下内容将添加到「旅行账本」"),
    ).toBeInTheDocument();
    expect(actions.persistSetup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "修改基本信息" }));
    expectStep("基本信息");
    expect(screen.getByLabelText("账本名称")).toHaveValue("旅行账本");
  });

  it("恢复时回到持久化步骤，前进和后退都不写库", async () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({ step: 3 }),
    });
    expectStep("商家");
    clickPrevious();
    expectStep("账户");
    clickPrevious();
    expectStep("基本信息");
    clickNext();
    expectStep("账户");
    expect(actions.persistSetup).not.toHaveBeenCalled();
  });

  it("有修改点关闭可继续编辑，草稿不变", () => {
    const actions = renderLedgerSetupWizard();
    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "待处理草稿" },
    });
    clickCloseWizard();
    expect(
      screen.getByRole("dialog", { name: "尚未保存" }),
    ).toBeInTheDocument();
    clickExit("继续编辑");
    expect(screen.getByLabelText("账本名称")).toHaveValue("待处理草稿");
    expect(actions.persistSetup).not.toHaveBeenCalled();
    expect(actions.onClose).not.toHaveBeenCalled();
  });

  it("没有修改也确认，保存时只提交当前进度", async () => {
    const progress = createLedgerSetupProgressFixture({ step: 2 });
    const actions = renderLedgerSetupWizard({ progress });
    clickNext();
    expectStep("商家");
    clickCloseWizard();
    expect(
      screen.getByText("账本还没创建完，要保存当前进度再退出吗？"),
    ).toBeInTheDocument();
    clickExit("保存并退出");
    await waitFor(() => expect(actions.persistSetup).toHaveBeenCalledOnce());
    expect(actions.persistSetup.mock.calls[0][0]).toMatchObject({
      step: 3,
      expectedUpdatedAt: progress.setup.updatedAt,
      complete: false,
    });
    await waitFor(() => expect(actions.onClose).toHaveBeenCalledOnce());
  });

  it("首次保存并退出携带客户端 UUID 和完整草稿", async () => {
    const actions = renderLedgerSetupWizard();
    clickNext();
    clickNext();
    clickCloseWizard();
    clickExit("保存并退出");
    await waitFor(() => expect(actions.persistSetup).toHaveBeenCalledOnce());
    const input = actions.persistSetup.mock.calls[0][0];
    expect(input.setup.id).toMatch(/^[a-f0-9-]{36}$/);
    expect(input.expectedUpdatedAt).toBeNull();
    expect(input.step).toBe(3);
    expect(input.setup.draft.accounts.items.length).toBeGreaterThan(0);
  });

  it("放弃修改不会调用 abandon，也不会写库", async () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({ step: 3 }),
    });
    clickPrevious();
    clickCloseWizard();
    clickExit("放弃修改");
    await waitFor(() => expect(actions.onClose).toHaveBeenCalledOnce());
    expect(actions.persistSetup).not.toHaveBeenCalled();
    expect(actions.abandonSetup).not.toHaveBeenCalled();
  });

  it("保存失败保留草稿并允许再次请求", async () => {
    const persistSetup = createPersistMock();
    persistSetup.mockResolvedValueOnce({ error: "服务器保存失败" });
    const actions = renderLedgerSetupWizard({ persistSetup });
    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "失败后仍保留" },
    });
    clickCloseWizard();
    clickExit("保存并退出");
    await waitFor(() => expect(actions.persistSetup).toHaveBeenCalledOnce());
    expect(actions.onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("账本名称")).toHaveValue("失败后仍保留");
  });

  it("首次未保存也可以从确认页完成创建，且只提交一次", async () => {
    const actions = renderLedgerSetupWizard();
    clickNext();
    clickNext();
    clickNext();
    clickNext();
    expect(actions.persistSetup).not.toHaveBeenCalled();
    await completeSetupAndWait();
    expect(actions.persistSetup).toHaveBeenCalledOnce();
    expect(actions.persistSetup.mock.calls[0][0]).toMatchObject({
      complete: true,
      expectedUpdatedAt: null,
      step: 5,
    });
    expectStep("邀请");
  });

  it.each([false, true])(
    "预设更新后留在向导并可重新提交，完成创建为 %s",
    async (complete) => {
      const progress = createLedgerSetupConfirmProgressFixture();
      const draft = {
        ...progress.setup.draft,
        templateVersion: 5,
      };
      const persistSetup = createPersistMock();
      persistSetup.mockResolvedValueOnce({
        refreshedTemplate: { draft, template: progress.template },
      });
      const actions = renderLedgerSetupWizard({ progress, persistSetup });
      const submit = () => {
        if (complete) clickCompleteSetup();
        else {
          clickCloseWizard();
          clickExit("保存并退出");
        }
      };

      submit();
      expect(
        await screen.findByText("预设内容已更新，请重新确认。"),
      ).toBeInTheDocument();
      expectStep("确认");
      expect(actions.onClose).not.toHaveBeenCalled();
      submit();
      await waitFor(() => expect(persistSetup).toHaveBeenCalledTimes(2));
      expect(persistSetup.mock.calls[1][0]).toMatchObject({
        setup: { draft, id: progress.setup.id },
        complete,
        expectedUpdatedAt: progress.setup.updatedAt,
      });
      if (complete) await waitFor(() => expectStep("邀请"));
      else await waitFor(() => expect(actions.onClose).toHaveBeenCalledOnce());
    },
  );

  it("完成失败不误入邀请页，后续可以重试", async () => {
    const persistSetup = createPersistMock();
    persistSetup.mockResolvedValueOnce({ error: "并发冲突" });
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupConfirmProgressFixture(),
      persistSetup,
    });
    clickCompleteSetup();
    await waitFor(() => expect(actions.persistSetup).toHaveBeenCalledOnce());
    expectStep("确认");
    expect(actions.onClose).not.toHaveBeenCalled();
  });

  it("邀请阶段关闭不再弹未保存确认", async () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupConfirmProgressFixture(),
    });
    await completeSetupAndWait();
    clickCloseWizard();
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
    await waitFor(() => expect(actions.onClose).toHaveBeenCalledOnce());
  });

  it("确认页功能卡片来自父层当前草稿", () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({ step: 4 }),
    });
    fireEvent.click(screen.getByRole("switch", { name: "启用特殊状态" }));
    clickNext();
    expectStep("确认");
    const card = screen.getByRole("region", { name: "功能" });
    expect(
      within(card).getByText("报销与退款状态 · 已开启"),
    ).toBeInTheDocument();
    expect(actions.persistSetup).not.toHaveBeenCalled();
  });
});
