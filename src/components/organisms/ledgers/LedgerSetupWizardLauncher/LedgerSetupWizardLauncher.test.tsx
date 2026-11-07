import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createLedgerSetupWizardLauncherActionMocks,
  getCurrentStepItem,
  ledgerSetupWizardTestDefaults,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import {
  ledgerSetupAbandonMessages,
  ledgerSetupEntryMessages,
} from "config/ledgerSetupMessages";
import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupWriteErrorMessages,
} from "internal/ledger";
import {
  confirmLedgerSetupAbandon,
  openLedgerSetupAbandonConfirm,
  discardLedgerSetupWizardChanges,
} from "test/ledgerSetupAbandon";
import { setupGuardHistoryMock } from "test/mockGuardHistory";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";
import type { LedgerSetupWizardViewActionState } from "types/ledgers";

import { LedgerSetupWizardLauncher } from "./LedgerSetupWizardLauncher";
import { useLedgerSetupWizardLauncher } from "./useLedgerSetupWizardLauncher";

setupGuardHistoryMock();

const routerRefreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefreshMock }),
}));

function LauncherHarness({
  actions,
}: {
  actions: ReturnType<typeof createLedgerSetupWizardLauncherActionMocks>;
}) {
  const launcher = useLedgerSetupWizardLauncher(actions);

  return (
    <>
      <button onClick={() => launcher.openWizard("create")}>打开</button>
      <button onClick={() => launcher.openWizard("resume")}>继续</button>
      <LedgerSetupWizardLauncher launcher={launcher} />
    </>
  );
}

function renderLauncher(
  actions = createLedgerSetupWizardLauncherActionMocks(),
) {
  render(
    <ConfirmDialogTestProviders>
      <LauncherHarness actions={actions} />
    </ConfirmDialogTestProviders>,
  );

  return actions;
}

function clickOpen() {
  fireEvent.click(screen.getByRole("button", { name: "打开" }));
}

function findWizardDialog() {
  return screen.findByRole("dialog", { name: "创建账本" });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LedgerSetupWizardLauncher", () => {
  it("打开前不读取向导数据，打开时读取并显示向导第 1 步", async () => {
    const actions = renderLauncher();

    expect(actions.loadWizard).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    clickOpen();

    const dialog = await findWizardDialog();
    expect(actions.loadWizard).toHaveBeenCalledTimes(1);
    expect(
      within(dialog).getByRole("heading", { name: "先给账本起个名字吧" }),
    ).toBeInTheDocument();
    // 没有创建中账本时不显示提示。
    expect(within(dialog).queryByRole("status")).not.toBeInTheDocument();
  });

  it("读取中在弹框内显示加载状态", async () => {
    let resolveLoad: (
      state: LedgerSetupWizardViewActionState,
    ) => void = () => {};
    const actions = createLedgerSetupWizardLauncherActionMocks();
    actions.loadWizard.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );
    renderLauncher(actions);

    clickOpen();

    const loadingDialog = screen.getByRole("dialog", {
      name: "正在打开创建账本向导",
    });
    expect(
      within(loadingDialog).getByRole("progressbar", { hidden: true }),
    ).toBeInTheDocument();

    resolveLoad({ error: "x" });
    expect(await screen.findByText("x")).toBeInTheDocument();
  });

  it("读取失败时显示错误并可重试", async () => {
    const actions = createLedgerSetupWizardLauncherActionMocks();
    actions.loadWizard.mockResolvedValueOnce({
      error: "创建中的账本加载失败，请稍后重试。",
    });
    renderLauncher(actions);

    clickOpen();

    const errorDialog = await screen.findByRole("dialog", {
      name: "创建账本向导读取失败",
    });
    expect(
      within(errorDialog).getByText("创建中的账本加载失败，请稍后重试。"),
    ).toBeInTheDocument();

    fireEvent.click(within(errorDialog).getByRole("button", { name: "重试" }));

    await findWizardDialog();
    expect(actions.loadWizard).toHaveBeenCalledTimes(2);
  });

  it("Server Action 调用本身失败时显示通用读取失败文案", async () => {
    const actions = createLedgerSetupWizardLauncherActionMocks();
    actions.loadWizard.mockRejectedValueOnce(new Error("network"));
    renderLauncher(actions);

    clickOpen();

    expect(
      await screen.findByText("创建中的账本加载失败，请稍后重试。"),
    ).toBeInTheDocument();
  });

  it("关闭读取失败的弹框后不刷新页面", async () => {
    const actions = createLedgerSetupWizardLauncherActionMocks();
    actions.loadWizard.mockResolvedValueOnce({ error: "失败" });
    renderLauncher(actions);

    clickOpen();
    const errorDialog = await screen.findByRole("dialog", {
      name: "创建账本向导读取失败",
    });
    fireEvent.click(within(errorDialog).getByRole("button", { name: "关闭" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });

  it("以创建意图打开且已有创建中账本时，恢复到上次的步骤并显示提示", async () => {
    const progress = createLedgerSetupProgressFixture({ step: 3 });
    renderLauncher(createLedgerSetupWizardLauncherActionMocks(progress));

    clickOpen();

    const dialog = await findWizardDialog();
    expect(
      within(dialog).getByText(ledgerSetupEntryMessages.draftNotice),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", {
        name: ledgerSetupEntryMessages.restart,
      }),
    ).toBeEnabled();
    expect(getCurrentStepItem()).toHaveTextContent("商家");
  });

  function openDraft(step = 3) {
    const progress = createLedgerSetupProgressFixture({
      step,
      name: "旅行账本",
    });
    const actions = renderLauncher(
      createLedgerSetupWizardLauncherActionMocks(progress),
    );
    clickOpen();
    return { progress, abandonSetup: actions.wizard.abandonSetup };
  }

  function openRestartConfirm() {
    return openLedgerSetupAbandonConfirm(
      "旅行账本",
      ledgerSetupEntryMessages.restart,
    );
  }

  it("确认放弃后用新建默认值重置第 1 步，关闭向导时刷新入口", async () => {
    const { abandonSetup, progress } = openDraft(1);
    const name = await screen.findByRole("textbox", { name: "账本名称" });
    fireEvent.change(name, { target: { value: "未保存的名称" } });
    const dialog = await findWizardDialog();
    const close = within(dialog).getByRole("button", {
      name: "关闭创建账本向导",
    });
    const next = within(dialog).getByRole("button", { name: "下一步" });
    const restart = within(dialog).getByRole("button", {
      name: ledgerSetupEntryMessages.restart,
    });
    let finish!: () => void;
    abandonSetup.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({});
        }),
    );
    confirmLedgerSetupAbandon(await openRestartConfirm());
    await waitFor(() => expect(restart).toBeDisabled());
    expect(
      within(restart).getByRole("progressbar", {
        name: ledgerSetupAbandonMessages.pending,
      }),
    ).toBeInTheDocument();
    expect(close).toBeDisabled();
    expect(next).toBeDisabled();
    expect(abandonSetup).toHaveBeenCalledWith({ ledgerId: progress.setup.id });

    await act(async () => finish());
    expect(getCurrentStepItem()).toHaveTextContent("基本信息");
    expect(screen.getByRole("textbox", { name: "账本名称" })).toHaveValue(
      ledgerSetupWizardTestDefaults.ledgerName,
    );
    expect(within(dialog).queryByRole("status")).not.toBeInTheDocument();
    expect(routerRefreshMock).not.toHaveBeenCalled();

    fireEvent.click(close);
    await discardLedgerSetupWizardChanges();
    await waitFor(() => expect(routerRefreshMock).toHaveBeenCalledOnce());
  });

  it("取消重新创建时保留当前步骤与提示", async () => {
    const { abandonSetup } = openDraft();
    const confirm = await openRestartConfirm();
    fireEvent.click(
      within(confirm).getByRole("button", {
        name: ledgerSetupAbandonMessages.cancel,
      }),
    );
    await findWizardDialog();
    expect(abandonSetup).not.toHaveBeenCalled();
    expect(getCurrentStepItem()).toHaveTextContent("商家");
    expect(
      screen.getByRole("button", { name: ledgerSetupEntryMessages.restart }),
    ).toBeEnabled();
  });

  it.each([
    ledgerSetupErrorMessages[ledgerSetupErrorCodes.hasMembers],
    ledgerSetupErrorMessages[ledgerSetupErrorCodes.hasTransactions],
    null,
  ])("放弃失败后保留当前步骤与提示（%s）", async (error) => {
    const { abandonSetup } = openDraft();
    if (error) abandonSetup.mockResolvedValueOnce({ error });
    else abandonSetup.mockRejectedValueOnce(new Error("network"));
    confirmLedgerSetupAbandon(await openRestartConfirm());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      error ?? ledgerSetupWriteErrorMessages.abandonFailed,
    );
    expect(getCurrentStepItem()).toHaveTextContent("商家");
    expect(
      screen.getByText(ledgerSetupEntryMessages.draftNotice),
    ).toBeInTheDocument();
  });

  it("以继续意图打开时恢复到上次的步骤，不显示提示", async () => {
    const progress = createLedgerSetupProgressFixture({ step: 3 });
    renderLauncher(createLedgerSetupWizardLauncherActionMocks(progress));

    fireEvent.click(screen.getByRole("button", { name: "继续" }));

    const dialog = await findWizardDialog();
    expect(getCurrentStepItem()).toHaveTextContent("商家");
    expect(
      within(dialog).queryByText(ledgerSetupEntryMessages.draftNotice),
    ).not.toBeInTheDocument();
  });

  it("读取失败后重试沿用原来的打开意图", async () => {
    const progress = createLedgerSetupProgressFixture({ step: 3 });
    const actions = createLedgerSetupWizardLauncherActionMocks(progress);
    actions.loadWizard.mockResolvedValueOnce({ error: "失败" });
    renderLauncher(actions);

    fireEvent.click(screen.getByRole("button", { name: "继续" }));
    const errorDialog = await screen.findByRole("dialog", {
      name: "创建账本向导读取失败",
    });
    fireEvent.click(within(errorDialog).getByRole("button", { name: "重试" }));

    const dialog = await findWizardDialog();
    expect(
      within(dialog).queryByText(ledgerSetupEntryMessages.draftNotice),
    ).not.toBeInTheDocument();
  });

  it("关闭向导后刷新页面", async () => {
    renderLauncher();

    clickOpen();
    const dialog = await findWizardDialog();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "关闭创建账本向导" }),
    );
    await discardLedgerSetupWizardChanges();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(routerRefreshMock).toHaveBeenCalledTimes(1);
  });
});
