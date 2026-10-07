import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, type Mock } from "vitest";

import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupWriteErrorMessages,
} from "internal/ledger";
import {
  clickCloseWizard,
  clickCompleteSetup,
  completeSetupAndWait,
  getCurrentStepItem,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { createLedgerSetupConfirmProgressFixture } from "test/mocks/ledgerSetup";
import type {
  LedgerSetupCompleteAction,
  LedgerSetupCompleteActionState,
  LedgerSetupDraftSaveAction,
} from "types/ledgers";

/** 渲染停在第 5 步「确认一览」的向导。 */
function renderConfirmStep({
  completeSetup,
  progress = createLedgerSetupConfirmProgressFixture(),
  saveDraft,
}: {
  completeSetup?: Mock<LedgerSetupCompleteAction>;
  progress?: ReturnType<typeof createLedgerSetupConfirmProgressFixture>;
  saveDraft?: Mock<LedgerSetupDraftSaveAction>;
} = {}) {
  return renderLedgerSetupWizard({ completeSetup, progress, saveDraft });
}

function getCard(title: string | RegExp) {
  return screen.getByRole("region", { name: title });
}

function getEditButton(title: string) {
  return screen.getByRole("button", { name: `修改${title}` });
}

/** 一直处于提交中的完成写入。 */
function createPendingComplete() {
  let resolve: (state: LedgerSetupCompleteActionState) => void = () => {};
  const completeSetup = vi.fn<LedgerSetupCompleteAction>(
    () =>
      new Promise((next) => {
        resolve = next;
      }),
  );

  return {
    completeSetup,
    resolve: (state: LedgerSetupCompleteActionState) => resolve(state),
  };
}

describe("LedgerSetupConfirmStep", () => {
  describe("摘要卡片", () => {
    it("显示标题与将添加到的账本名", () => {
      renderConfirmStep();

      expect(getCurrentStepItem()).toHaveTextContent("确认");
      expect(
        screen.getByRole("heading", { name: "确认一下，马上就好" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("以下内容将添加到「家庭账本」"),
      ).toBeInTheDocument();
    });

    it("基本信息显示账本名、货币、我的显示名与个性色圆点", () => {
      renderConfirmStep();

      const card = getCard("基本信息");
      expect(card).toHaveTextContent("家庭账本 · JPY 日元 · 淞文");
      expect(
        within(card).getByRole("img", { name: "个性色：琥珀橙" }),
      ).toBeInTheDocument();
    });

    it("账户显示数量与账户名 Chip", () => {
      renderConfirmStep();

      const card = getCard("账户（2）");
      expect(within(card).getByText("现金")).toBeInTheDocument();
      expect(within(card).getByText("楽天銀行")).toBeInTheDocument();
      expect(within(card).queryByText("已跳过")).not.toBeInTheDocument();
    });

    it("商家按标签显示 emoji 与已选数量，标题为去重后的商家数", () => {
      renderConfirmStep();

      const card = getCard("商家（5 家）");
      const chips = within(card)
        .getAllByText(/^\S+ \d+$/)
        .map((chip) => chip.textContent);
      // 按标签 sortOrder：超市、餐饮、家电数码、电商、订阅服务。
      expect(chips).toEqual(["🛒 2", "🍽️ 1", "🔌 1", "📦 1", "🎬 2"]);
      expect(within(card).getByLabelText("订阅服务 2 家")).toBeInTheDocument();
    });

    it("分类显示前 6 个大分类与「等 N 个」，点击后展开全部，且没有修改按钮", () => {
      renderConfirmStep();

      const card = getCard("分类（自动创建）");
      expect(card).toHaveTextContent("按默认创建，之后可在分类管理中调整");
      expect(within(card).getByText("💰 工资收入")).toBeInTheDocument();
      expect(within(card).getByText("👗 穿衣")).toBeInTheDocument();
      expect(within(card).queryByText("🎮 玩耍")).not.toBeInTheDocument();
      expect(within(card).getByText("等 12 个")).toBeInTheDocument();

      fireEvent.click(
        within(card).getByRole("button", { name: "展开全部 12 个分类" }),
      );

      expect(within(card).getByText("💊 医疗")).toBeInTheDocument();
      expect(within(card).getByText("💴 金融")).toBeInTheDocument();
      expect(within(card).queryByText("等 12 个")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "修改分类（自动创建）" }),
      ).not.toBeInTheDocument();
    });

    it.each([
      [true, "报销与退款状态 · 已开启"],
      [false, "报销与退款状态 · 未开启"],
    ])("功能显示特殊状态开关（%s）", (specialStatusEnabled, text) => {
      renderConfirmStep({
        progress: createLedgerSetupConfirmProgressFixture({
          features: { specialStatusEnabled },
        }),
      });

      expect(getCard("功能")).toHaveTextContent(text);
    });
  });

  describe("已跳过", () => {
    it.each([
      [
        "跳过",
        { items: [{ name: "现金", type: "cash" as const }], skipped: true },
      ],
      ["0 个", { items: [], skipped: false }],
    ])("账户%s时显示已跳过样式与提示", (_label, accounts) => {
      renderConfirmStep({
        progress: createLedgerSetupConfirmProgressFixture({ accounts }),
      });

      const card = getCard(/^账户/);
      expect(card).toHaveTextContent("已跳过");
      expect(card).toHaveTextContent("记账前需要先添加账户");
      expect(card).toHaveStyle({ borderStyle: "dashed" });
      expect(within(card).queryByText("现金")).not.toBeInTheDocument();
      expect(getEditButton("账户")).toBeInTheDocument();
    });

    it.each([
      [
        "跳过",
        createLedgerSetupConfirmProgressFixture({
          merchants: { selectedKeys: ["aeon"], skipped: true },
        }),
      ],
      [
        "0 家",
        createLedgerSetupConfirmProgressFixture({
          merchants: { selectedKeys: [], skipped: false },
        }),
      ],
      ["无模板币种", createLedgerSetupConfirmProgressFixture({}, null)],
    ])("商家%s时显示已跳过样式与提示", (_label, progress) => {
      renderConfirmStep({ progress });

      const card = getCard(/^商家/);
      expect(card).toHaveTextContent("已跳过");
      expect(card).toHaveTextContent("记账前需要先添加商家");
      expect(card).toHaveStyle({ borderStyle: "dashed" });
      expect(within(card).queryByText(/^🛒/)).not.toBeInTheDocument();
    });

    it("有内容的卡片不显示已跳过样式", () => {
      renderConfirmStep();

      expect(getCard("账户（2）")).not.toHaveStyle({ borderStyle: "dashed" });
      expect(getCard("商家（5 家）")).not.toHaveStyle({
        borderStyle: "dashed",
      });
    });
  });

  describe("修改与上一步", () => {
    it.each([
      ["基本信息", "基本信息"],
      ["账户（2）", "账户"],
      ["商家（5 家）", "商家"],
      ["功能", "功能"],
    ])("点击「修改%s」跳到对应步骤", (cardTitle, stepLabel) => {
      renderConfirmStep();

      fireEvent.click(getEditButton(cardTitle));

      expect(getCurrentStepItem()).toHaveTextContent(stepLabel);
    });

    it("上一步返回功能步骤，不保存草稿", () => {
      const saveDraft = vi.fn<LedgerSetupDraftSaveAction>();
      renderConfirmStep({ saveDraft });

      fireEvent.click(screen.getByRole("button", { name: "上一步" }));

      expect(getCurrentStepItem()).toHaveTextContent("功能");
      expect(saveDraft).not.toHaveBeenCalled();
    });
  });

  describe("完成创建", () => {
    it("完成写入成功后进入邀请步骤，关闭时不再提示稍后继续", async () => {
      const progress = createLedgerSetupConfirmProgressFixture();
      const { completeSetup, onClose } = renderConfirmStep({ progress });

      await completeSetupAndWait();
      clickCloseWizard();

      expect(completeSetup).toHaveBeenCalledWith({
        ledgerId: progress.setup.id,
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole("dialog", { name: "稍后再继续？" }),
      ).not.toBeInTheDocument();
    });

    it("提交中锁定关闭、上一步与全部修改按钮，且不能重复提交", async () => {
      const { completeSetup, resolve } = createPendingComplete();
      renderConfirmStep({ completeSetup });

      const completeButton = screen.getByRole("button", { name: "完成创建" });
      fireEvent.click(completeButton);
      fireEvent.click(completeButton);

      const loadingButton = await screen.findByRole("button", {
        name: "创建中",
      });
      expect(loadingButton).toBeDisabled();
      fireEvent.click(loadingButton);
      expect(completeSetup).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole("button", { name: "关闭创建账本向导" }),
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();
      for (const title of ["基本信息", "账户（2）", "商家（5 家）", "功能"]) {
        expect(getEditButton(title)).toBeDisabled();
      }

      resolve({ completed: true });
      await waitFor(() =>
        expect(getCurrentStepItem()).toHaveTextContent("邀请"),
      );
    });

    it("预设内容已更新时重新读取进度、显示提示条并停留在确认一览", async () => {
      const refreshed = createLedgerSetupConfirmProgressFixture({
        merchants: { selectedKeys: ["aeon"], skipped: false },
      });
      const completeSetup = vi.fn<LedgerSetupCompleteAction>(async () => ({
        outdated: true,
        progress: refreshed,
      }));
      renderConfirmStep({ completeSetup });

      clickCompleteSetup();

      expect(
        await screen.findByText("预设内容已更新，请重新确认"),
      ).toBeInTheDocument();
      expect(getCurrentStepItem()).toHaveTextContent("确认");
      expect(getCard("商家（1 家）")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "完成创建" }),
      ).not.toBeDisabled();
    });

    it("创建中账本不存在时显示失败提示，锁定操作且关闭时不再提示稍后继续", async () => {
      const message = ledgerSetupErrorMessages[ledgerSetupErrorCodes.notFound];
      const completeSetup = vi.fn<LedgerSetupCompleteAction>(async () => ({
        error: message,
        errorKey: "not-found",
        notFound: true,
      }));
      const { onClose } = renderConfirmStep({ completeSetup });

      clickCompleteSetup();

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByText("账本创建失败")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "完成创建" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "上一步" })).toBeDisabled();
      expect(getEditButton("账户（2）")).toBeDisabled();

      clickCloseWizard();

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole("dialog", { name: "稍后再继续？" }),
      ).not.toBeInTheDocument();
    });

    it("其他失败时显示模块错误文案并停留在确认一览", async () => {
      const message =
        ledgerSetupErrorMessages[ledgerSetupErrorCodes.accountNameDuplicate];
      const completeSetup = vi.fn<LedgerSetupCompleteAction>(async () => ({
        error: message,
        errorKey: "duplicate",
      }));
      renderConfirmStep({ completeSetup });

      clickCompleteSetup();

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(getCurrentStepItem()).toHaveTextContent("确认");
      expect(
        screen.getByRole("button", { name: "完成创建" }),
      ).not.toBeDisabled();
    });

    it("调用异常时显示完成失败的通用提示，可以再次提交", async () => {
      const completeSetup = vi
        .fn<LedgerSetupCompleteAction>()
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce({ completed: true });
      renderConfirmStep({ completeSetup });

      clickCompleteSetup();

      expect(
        await screen.findByText(ledgerSetupWriteErrorMessages.completeFailed),
      ).toBeInTheDocument();
      expect(getCurrentStepItem()).toHaveTextContent("确认");
      expect(
        screen.getByRole("button", { name: "关闭创建账本向导" }),
      ).not.toBeDisabled();

      await completeSetupAndWait();
      expect(completeSetup).toHaveBeenCalledTimes(2);
    });
  });
});
