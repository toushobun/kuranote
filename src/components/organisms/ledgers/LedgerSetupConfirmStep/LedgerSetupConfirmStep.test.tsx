import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  clickCompleteSetup,
  createPersistMock,
  getCurrentStepItem,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { createLedgerSetupConfirmProgressFixture } from "test/mocks/ledgerSetup";

describe("LedgerSetupConfirmStep", () => {
  it("确认页从同一份草稿显示账户、商家和功能", () => {
    renderLedgerSetupWizard({
      progress: createLedgerSetupConfirmProgressFixture(),
    });
    expect(
      screen.getByText("以下内容将添加到「家庭账本」"),
    ).toBeInTheDocument();
    const account = screen.getByRole("region", { name: "账户（2）" });
    expect(within(account).getByText("日元现金")).toBeInTheDocument();
    expect(within(account).getByText("楽天銀行")).toBeInTheDocument();
    const merchant = screen.getByRole("region", { name: "商家（5 家）" });
    expect(merchant).toBeInTheDocument();
    expect(within(merchant).getByText(/🍽️ 1/)).toBeInTheDocument();
  });

  it("确认页跳回修改基本信息不提交服务端", () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupConfirmProgressFixture(),
    });
    fireEvent.click(screen.getByRole("button", { name: "修改基本信息" }));
    expect(getCurrentStepItem()).toHaveTextContent("基本信息");
    expect(actions.persistSetup).not.toHaveBeenCalled();
  });

  it("点完成创建一次提交本地完整草稿进入邀请", async () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupConfirmProgressFixture(),
    });
    clickCompleteSetup();
    await waitFor(() => expect(actions.persistSetup).toHaveBeenCalledOnce());
    expect(actions.persistSetup.mock.calls[0][0]).toMatchObject({
      complete: true,
      step: 5,
    });
    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("邀请"));
  });

  it("创建失败停留确认页且不伪造完成状态", async () => {
    const persistSetup = createPersistMock();
    persistSetup.mockResolvedValueOnce({ error: "请重新打开最新账本草稿" });
    renderLedgerSetupWizard({
      progress: createLedgerSetupConfirmProgressFixture(),
      persistSetup,
    });
    clickCompleteSetup();
    await waitFor(() => expect(persistSetup).toHaveBeenCalledOnce());
    expect(getCurrentStepItem()).toHaveTextContent("确认");
  });

  it("重复点击完成只启动一次写入", async () => {
    let finish: (result: {
      updatedAt: string;
      completed: boolean;
    }) => void = () => {};
    const persistSetup = createPersistMock();
    persistSetup.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderLedgerSetupWizard({
      progress: createLedgerSetupConfirmProgressFixture(),
      persistSetup,
    });
    clickCompleteSetup();
    clickCompleteSetup();
    expect(persistSetup).toHaveBeenCalledOnce();
    finish({ updatedAt: "2026-11-07T01:00:00Z", completed: true });
    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("邀请"));
  });
});
