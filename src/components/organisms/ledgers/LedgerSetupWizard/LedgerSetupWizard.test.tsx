import {
  ledgerSetupEntryMessages,
  ledgerSetupWizardMessages,
} from "config/ledgerSetupMessages";
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockIntlTimeZone } from "test/mockIntlTimeZone";

import { backFromGuard, setupGuardHistoryMock } from "test/mockGuardHistory";
import { mockMatchMedia } from "test/matchMedia";
import {
  createLedgerSetupProgressFixture,
  createLedgerSetupConfirmProgressFixture,
  ledgerSetupTemplateFixture,
} from "test/mocks/ledgerSetup";

import {
  clickCloseWizard,
  clickNext,
  completeSetupAndWait,
  createSaveDraftMock,
  finishInviteAndWait,
  getCurrentStepItem,
  getLedgerSetupWizardDialog,
  goPreviousTo,
  renderLedgerSetupWizard,
  renderLedgerSetupWizardAtInviteStep,
  waitForInviteEntry,
} from "./ledgerSetupWizardTestUtils";

beforeEach(() => {
  mockIntlTimeZone("Asia/Tokyo");
});
afterEach(() => {
  vi.restoreAllMocks();
});

setupGuardHistoryMock();

let restoreMatchMedia: (() => void) | null = null;

afterEach(() => {
  restoreMatchMedia?.();
  restoreMatchMedia = null;
});

function expectCurrentStep(label: string) {
  expect(getCurrentStepItem()).toHaveTextContent(label);
}

describe("LedgerSetupWizard", () => {
  describe("响应式", () => {
    it("移动端（xs）全屏显示", async () => {
      restoreMatchMedia = mockMatchMedia(true);
      renderLedgerSetupWizard();

      await waitFor(() => {
        expect(getLedgerSetupWizardDialog()).toHaveClass(
          "MuiDialog-paperFullScreen",
        );
      });
    });

    it("桌面端（sm 以上）显示为常规弹框", () => {
      restoreMatchMedia = mockMatchMedia(false);
      renderLedgerSetupWizard();

      expect(getLedgerSetupWizardDialog()).not.toHaveClass(
        "MuiDialog-paperFullScreen",
      );
    });
  });

  describe("步骤", () => {
    it("尚未创建账本时从第 1 步开始，只有下一步按钮", () => {
      renderLedgerSetupWizard();

      expect(
        screen.getByRole("heading", { name: "创建账本" }),
      ).toBeInTheDocument();
      expectCurrentStep("基本信息");
      expect(screen.getByText("先给账本起个名字吧")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "上一步" }),
      ).not.toBeInTheDocument();
    });

    it("已有创建中账本时恢复到上次的步骤", () => {
      renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 3 }),
      });

      expectCurrentStep("商家");
      expect(
        screen.getByRole("heading", { name: "挑选常去的商家" }),
      ).toBeInTheDocument();
    });

    it("可以通过上一步 / 下一步在步骤之间切换", async () => {
      renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 2 }),
      });

      expectCurrentStep("账户");
      clickNext();
      await waitFor(() => expectCurrentStep("商家"));
      await goPreviousTo("账户");
      await goPreviousTo("基本信息");
      expect(screen.getByLabelText("账本名称")).toHaveValue("家庭账本");
    });

    it("第 1 步提交成功后进入第 2 步，返回第 1 步时显示保存后的内容", async () => {
      const progress = createLedgerSetupProgressFixture({
        name: "旅行账本",
      });
      renderLedgerSetupWizard({
        saveDraft: createSaveDraftMock(progress),
        submitBasicInfo: vi.fn(async () => ({ progress })),
      });

      fireEvent.change(screen.getByLabelText("账本名称"), {
        target: { value: "旅行账本" },
      });
      clickNext();

      await waitFor(() => expectCurrentStep("账户"));
      await goPreviousTo("基本信息");
      expect(screen.getByLabelText("账本名称")).toHaveValue("旅行账本");
    });

    it("预设更新提示不提供重新创建", async () => {
      const progress = createLedgerSetupProgressFixture({ step: 2 });
      renderLedgerSetupWizard({
        progress,
        saveDraft: vi.fn(async () => ({ outdated: true, progress })),
      });
      clickNext();
      const notice = within(await screen.findByRole("status"));
      expect(
        notice.getByText(ledgerSetupWizardMessages.templateUpdatedNotice),
      ).toBeInTheDocument();
      expect(
        notice.queryByRole("button", {
          name: ledgerSetupEntryMessages.restart,
        }),
      ).not.toBeInTheDocument();
    });

    it("完成创建后进入第 6 步：第 1～5 步为已完成，第 6 步为当前", async () => {
      await renderLedgerSetupWizardAtInviteStep();

      const items = within(
        screen.getByRole("list", { name: "创建进度" }),
      ).getAllByRole("listitem");
      expect(items.map((item) => item.dataset.status)).toEqual([
        "completed",
        "completed",
        "completed",
        "completed",
        "completed",
        "current",
      ]);
      expectCurrentStep("邀请");
    });

    it("第 6 步点击完成后显示完成页：不显示标题与进度条", async () => {
      await renderLedgerSetupWizardAtInviteStep();
      await waitForInviteEntry();

      await finishInviteAndWait();

      expect(
        screen.getByRole("dialog", { name: "一切就绪！" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "创建账本" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("list", { name: "创建进度" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("关闭", () => {
    it("第 1 步没有修改时直接关闭", async () => {
      const { onClose, submitBasicInfo } = renderLedgerSetupWizard();

      clickCloseWizard();

      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
      expect(submitBasicInfo).not.toHaveBeenCalled();
    });

    it("第 1 步关闭确认可保留名称，后退放弃时不创建账本", async () => {
      const { onClose, submitBasicInfo, abandonSetup } =
        renderLedgerSetupWizard();
      const name = screen.getByRole("textbox", { name: "账本名称" });
      fireEvent.change(name, { target: { value: "未提交的账本" } });

      clickCloseWizard();
      const dialog = within(screen.getByRole("dialog", { name: "尚未保存" }));
      expect(
        dialog.getByText("修正的内容尚未保存，是否放弃修改？"),
      ).toBeInTheDocument();
      expect(
        dialog.getAllByRole("button").map((button) => button.textContent),
      ).toEqual(["继续编辑", "放弃修改"]);
      fireEvent.click(dialog.getByRole("button", { name: "继续编辑" }));
      expect(name).toHaveValue("未提交的账本");
      expect(onClose).not.toHaveBeenCalled();

      await backFromGuard();
      fireEvent.click(screen.getByRole("button", { name: "放弃修改" }));
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(submitBasicInfo).not.toHaveBeenCalled();
      expect(abandonSetup).not.toHaveBeenCalled();
    });

    it("保存第 1 步后可直接关闭，并从保存的进度恢复第 2 步", async () => {
      const progress = createLedgerSetupProgressFixture({
        name: "旅行账本",
        step: 2,
      });
      const { onClose, abandonSetup } = renderLedgerSetupWizard({
        submitBasicInfo: vi.fn(async () => ({ progress })),
      });
      fireEvent.change(screen.getByLabelText("账本名称"), {
        target: { value: progress.setup.name },
      });
      clickNext();
      await waitFor(() => expectCurrentStep("账户"));

      clickCloseWizard();
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
      expect(abandonSetup).not.toHaveBeenCalled();

      cleanup();
      renderLedgerSetupWizard({ progress });
      expectCurrentStep("账户");
    });

    it.each([
      { step: 2, label: "账户", checkbox: "选择「现金」的全部账户" },
      { step: 3, label: "商家", checkbox: "选择「超市」的全部商家" },
    ])(
      "放弃「$label」步骤修改后重新进入时恢复已保存的选择",
      async ({ step, label, checkbox }) => {
        const saved =
          step === 2
            ? createLedgerSetupProgressFixture({}, ledgerSetupTemplateFixture)
            : createLedgerSetupConfirmProgressFixture();
        const progress = { ...saved, setup: { ...saved.setup, step } };
        const { onClose, abandonSetup, saveDraft } = renderLedgerSetupWizard({
          progress,
        });
        const selection = screen.getByRole("checkbox", { name: checkbox });
        expect(selection).toBeChecked();
        fireEvent.click(selection);
        expect(selection).not.toBeChecked();

        clickCloseWizard();
        const dialog = within(screen.getByRole("dialog", { name: "尚未保存" }));
        fireEvent.click(dialog.getByRole("button", { name: "放弃修改" }));
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect(saveDraft).not.toHaveBeenCalled();
        expect(abandonSetup).not.toHaveBeenCalled();

        cleanup();
        renderLedgerSetupWizard({ progress });
        expectCurrentStep(label);
        expect(screen.getByRole("checkbox", { name: checkbox })).toBeChecked();
      },
    );

    it("完成创建后进入邀请步骤（账本已完成），关闭时直接关闭", async () => {
      const { onClose } = renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 5 }),
      });

      await completeSetupAndWait();
      clickCloseWizard();

      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(
        screen.queryByRole("dialog", { name: "尚未保存" }),
      ).not.toBeInTheDocument();
    });
  });
});
