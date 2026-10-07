import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ledgerSetupLoadErrorMessages } from "internal/ledger";
import {
  clickCloseWizard,
  createLoadInviteMembersMock,
  finishInviteAndWait,
  getCurrentStepItem,
  renderLedgerSetupWizardAtInviteStep,
  waitForInviteEntry,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { ledgerSetupFixtureId } from "test/mocks/ledgerSetup";
import type {
  LedgerInviteStateAction,
  LedgerPlaceholderMemberStateAction,
  LedgerSetupInviteMembers,
  LedgerSetupInviteMembersActionState,
  LedgerSetupInviteMembersLoadAction,
} from "types/ledgers";

const placeholderMembers: LedgerSetupInviteMembers = {
  pendingInvites: [],
  placeholderMembers: [{ displayName: "奶奶", id: "placeholder-1" }],
};

function lastFormData(action: { mock: { calls: unknown[][] } }) {
  return action.mock.calls.at(-1)?.[1] as FormData;
}

/** 第一次读取返回 first，之后都返回 next。 */
function createSequentialLoadMock(
  first: LedgerSetupInviteMembersActionState,
  next: LedgerSetupInviteMembersActionState = { members: placeholderMembers },
) {
  return vi
    .fn<LedgerSetupInviteMembersLoadAction>()
    .mockResolvedValueOnce(first)
    .mockResolvedValue(next);
}

describe("LedgerSetupInviteStep", () => {
  describe("显示", () => {
    it("显示账本已创建的成功提示、标题、副文案与待邀请成员说明", async () => {
      await renderLedgerSetupWizardAtInviteStep();
      await waitForInviteEntry();

      expect(getCurrentStepItem()).toHaveTextContent("邀请");
      expect(screen.getByRole("alert")).toHaveTextContent(
        "账本已创建，可以开始记账了",
      );
      expect(
        screen.getByRole("heading", { name: "邀请家人一起记账" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("为家人生成专属邀请链接，TA 加入后记录会实时同步"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "待邀请成员不是账本成员，不能登录、记账，也不计入成员数；可以作为账户持有人。",
        ),
      ).toBeInTheDocument();
    });

    it("只有一个「完成」按钮，没有上一步与跳过", async () => {
      await renderLedgerSetupWizardAtInviteStep();
      await waitForInviteEntry();

      expect(screen.getByRole("button", { name: "完成" })).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: "上一步" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "跳过此步" }),
      ).not.toBeInTheDocument();
    });

    it("按新账本 ID 读取，并显示待邀请成员列表", async () => {
      const loadInviteMembers = createLoadInviteMembersMock(placeholderMembers);
      await renderLedgerSetupWizardAtInviteStep({ loadInviteMembers });

      expect(
        await screen.findByRole("button", { name: /^奶奶，/ }),
      ).toBeInTheDocument();
      expect(loadInviteMembers).toHaveBeenCalledWith({
        ledgerId: ledgerSetupFixtureId,
      });
    });
  });

  describe("读取状态", () => {
    it("读取中显示 loading", async () => {
      const loadInviteMembers = vi.fn<LedgerSetupInviteMembersLoadAction>(
        () => new Promise(() => {}),
      );
      await renderLedgerSetupWizardAtInviteStep({ loadInviteMembers });

      expect(screen.getByRole("status")).toHaveTextContent("正在读取邀请成员");
      expect(
        screen.queryByRole("button", { name: /^邀请成员/ }),
      ).not.toBeInTheDocument();
    });

    it("读取失败时显示 Action 返回的文案，重试成功后显示列表", async () => {
      const loadInviteMembers = createSequentialLoadMock({
        error: "只有账本所有者或管理员可以管理邀请。",
      });
      await renderLedgerSetupWizardAtInviteStep({ loadInviteMembers });

      const errorState = await screen.findByText("邀请成员读取失败");
      expect(errorState.closest("[role='alert']")).toHaveTextContent(
        "只有账本所有者或管理员可以管理邀请。",
      );

      fireEvent.click(screen.getByRole("button", { name: "重试" }));

      expect(
        await screen.findByRole("button", { name: /^奶奶，/ }),
      ).toBeInTheDocument();
      expect(loadInviteMembers).toHaveBeenCalledTimes(2);
    });

    it("Server Action 调用本身失败时显示通用读取失败文案", async () => {
      const loadInviteMembers = vi
        .fn<LedgerSetupInviteMembersLoadAction>()
        .mockRejectedValue(new Error("network"));
      await renderLedgerSetupWizardAtInviteStep({ loadInviteMembers });

      expect(
        await screen.findByText(
          ledgerSetupLoadErrorMessages.inviteMembersLoadFailed,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("邀请与待邀请成员管理", () => {
    it("邀请成员提交新账本 ID，结束后重新读取并就地显示新链接", async () => {
      const createInvite = vi.fn<LedgerInviteStateAction>(async () => ({
        createdInvite: {
          placeholderId: "placeholder-1",
          role: "member",
          token: "a".repeat(64),
        },
        operation: "invite",
        successKey: "success-1",
      }));
      const loadInviteMembers = createSequentialLoadMock({
        members: { pendingInvites: [], placeholderMembers: [] },
      });
      await renderLedgerSetupWizardAtInviteStep({
        createInvite,
        loadInviteMembers,
      });

      fireEvent.click(await waitForInviteEntry());
      fireEvent.change(screen.getByLabelText(/名字/), {
        target: { value: "奶奶" },
      });
      fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));

      await waitFor(() => expect(createInvite).toHaveBeenCalled());
      const formData = lastFormData(createInvite);
      expect(formData.get("intent")).toBe("invite");
      expect(formData.get("ledgerId")).toBe(ledgerSetupFixtureId);
      expect(formData.get("displayName")).toBe("奶奶");
      await waitFor(() => expect(loadInviteMembers).toHaveBeenCalledTimes(2));
      expect(
        await screen.findByText("创建链接成功，快去复制给你的亲友吧"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("img", { name: "账本邀请二维码，家庭账本" }),
      ).toBeInTheDocument();
    });

    it("改名成功后重新读取列表", async () => {
      const rename = vi.fn<LedgerPlaceholderMemberStateAction>(async () => ({
        operation: "rename",
        successKey: "success-rename",
      }));
      const loadInviteMembers = createLoadInviteMembersMock(placeholderMembers);
      await renderLedgerSetupWizardAtInviteStep({
        loadInviteMembers,
        placeholderMemberActions: { delete: vi.fn(), rename },
      });

      fireEvent.click(await screen.findByRole("button", { name: /^奶奶，/ }));
      fireEvent.change(screen.getByLabelText(/修改名字/), {
        target: { value: "外婆" },
      });
      fireEvent.click(screen.getByRole("button", { name: "保存名字" }));

      await waitFor(() => expect(rename).toHaveBeenCalled());
      expect(lastFormData(rename).get("ledgerId")).toBe(ledgerSetupFixtureId);
      await waitFor(() => expect(loadInviteMembers).toHaveBeenCalledTimes(2));
    });

    it("删除成功后重新读取列表", async () => {
      const remove = vi.fn<LedgerPlaceholderMemberStateAction>(async () => ({
        operation: "delete",
        successKey: "success-delete",
      }));
      const loadInviteMembers = createLoadInviteMembersMock(placeholderMembers);
      await renderLedgerSetupWizardAtInviteStep({
        loadInviteMembers,
        placeholderMemberActions: { delete: remove, rename: vi.fn() },
      });

      fireEvent.click(await screen.findByRole("button", { name: /^奶奶，/ }));
      fireEvent.click(screen.getByRole("button", { name: /删除待邀请成员/ }));
      const confirmDialog = await screen.findByRole("dialog", {
        name: "删除待邀请成员？",
      });
      fireEvent.click(
        within(confirmDialog).getByRole("button", { name: "删除" }),
      );

      await waitFor(() => expect(remove).toHaveBeenCalled());
      await waitFor(() => expect(loadInviteMembers).toHaveBeenCalledTimes(2));
    });

    it("改名失败时不重新读取", async () => {
      const rename = vi.fn<LedgerPlaceholderMemberStateAction>(async () => ({
        error: "名字不能为空。",
        errorKey: "error-1",
        operation: "rename",
      }));
      const loadInviteMembers = createLoadInviteMembersMock(placeholderMembers);
      await renderLedgerSetupWizardAtInviteStep({
        loadInviteMembers,
        placeholderMemberActions: { delete: vi.fn(), rename },
      });

      fireEvent.click(await screen.findByRole("button", { name: /^奶奶，/ }));
      fireEvent.click(screen.getByRole("button", { name: "保存名字" }));

      await waitFor(() => expect(rename).toHaveBeenCalled());
      expect(loadInviteMembers).toHaveBeenCalledTimes(1);
    });
  });

  describe("完成与关闭", () => {
    it("点击完成进入完成页", async () => {
      await renderLedgerSetupWizardAtInviteStep();
      await waitForInviteEntry();

      await finishInviteAndWait();

      expect(
        screen.queryByRole("button", { name: "完成" }),
      ).not.toBeInTheDocument();
    });

    it("点击「×」直接关闭向导，不提示稍后继续", async () => {
      const { onClose } = await renderLedgerSetupWizardAtInviteStep();

      clickCloseWizard();

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole("dialog", { name: "稍后再继续？" }),
      ).not.toBeInTheDocument();
    });
  });
});
