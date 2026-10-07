import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mockMatchMedia } from "test/matchMedia";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

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
    it("第 1 步且尚未创建账本时直接关闭", () => {
      const { onClose } = renderLedgerSetupWizard();

      clickCloseWizard();

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole("dialog", { name: "稍后再继续？" }),
      ).not.toBeInTheDocument();
    });

    it("已创建账本时显示稍后再继续的确认", () => {
      const { onClose } = renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 2 }),
      });

      clickCloseWizard();

      const prompt = screen.getByRole("dialog", { name: "稍后再继续？" });
      expect(prompt).toHaveAccessibleDescription(
        "目前的进度已保存。账本会显示为「创建中」，你可以随时回来继续完成。",
      );
      expect(onClose).not.toHaveBeenCalled();
    });

    it("返回第 1 步时也需要确认，因为账本已创建", async () => {
      renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 2 }),
      });

      await goPreviousTo("基本信息");
      clickCloseWizard();

      expect(
        screen.getByRole("dialog", { name: "稍后再继续？" }),
      ).toBeInTheDocument();
    });

    it("选择继续创建时留在向导", async () => {
      const { onClose } = renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 2 }),
      });

      clickCloseWizard();
      fireEvent.click(screen.getByRole("button", { name: "继续创建" }));

      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "稍后再继续？" }),
        ).not.toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
      expectCurrentStep("账户");
    });

    it("选择稍后再说时关闭向导", () => {
      const { onClose } = renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 2 }),
      });

      clickCloseWizard();
      fireEvent.click(screen.getByRole("button", { name: "稍后再说" }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("确认一览（账本尚未完成）关闭时需要确认", () => {
      const { onClose } = renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 5 }),
      });

      clickCloseWizard();

      expect(
        screen.getByRole("dialog", { name: "稍后再继续？" }),
      ).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("完成创建后进入邀请步骤（账本已完成），关闭时直接关闭", async () => {
      const { onClose } = renderLedgerSetupWizard({
        progress: createLedgerSetupProgressFixture({ step: 5 }),
      });

      await completeSetupAndWait();
      clickCloseWizard();

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole("dialog", { name: "稍后再继续？" }),
      ).not.toBeInTheDocument();
    });
  });
});
