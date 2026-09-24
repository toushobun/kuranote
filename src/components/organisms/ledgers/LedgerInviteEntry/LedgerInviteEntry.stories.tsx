import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { userEvent, within } from "storybook/test";

import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type { LedgerInviteStateAction } from "types/ledgers";

import { LedgerInviteEntry } from "./LedgerInviteEntry";
import { LedgerInvitePendingProvider } from "../LedgerInvitePendingContext/LedgerInvitePendingContext";

const action: LedgerInviteStateAction = async () => ({});
const placeholderMembers = [
  { displayName: "奶奶", id: "storybook-placeholder-1" },
  { displayName: "爷爷", id: "storybook-placeholder-2" },
];
const boundInvite = {
  createdAt: "2026-09-01T09:30:00.000Z",
  id: "storybook-bound-invite-id",
  placeholderId: placeholderMembers[0].id,
  role: "member" as const,
  token: "storybook-bound-invite-token",
};
const placeholderMemberActions = {
  delete: async () => ({}),
  rename: async () => ({}),
};

type LedgerInviteEntryArgs = ComponentProps<typeof LedgerInviteEntry>;

function renderEntry(args: LedgerInviteEntryArgs) {
  return (
    <UserThemeProvider storageScope="storybook-ledger-invite-entry">
      <ConfirmDialogProvider>
        {/* 只有管理者能读取待接受邀请；普通成员只看到待邀请成员摘要。 */}
        <LedgerInvitePendingProvider
          pendingInvites={args.canInvite ? [boundInvite] : []}
        >
          <LedgerInviteEntry {...args} />
        </LedgerInvitePendingProvider>
      </ConfirmDialogProvider>
    </UserThemeProvider>
  );
}

const meta = {
  title: "Organisms/Ledgers/LedgerInviteEntry",
  component: LedgerInviteEntry,
  args: {
    action,
    canInvite: true,
    ledgerId: "storybook-ledger",
    ledgerName: "家庭账本",
    placeholderMemberActions,
    placeholderMembers,
    token: null,
  },
  render: renderEntry,
} satisfies Meta<typeof LedgerInviteEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openInviteDialog(canvasElement: HTMLElement) {
  await userEvent.click(
    await within(canvasElement).findByRole("button", { name: /^邀请成员/ }),
  );
}

export const MemberList: Story = {
  name: "待邀请成员（已生成 / 未生成链接）与邀请成员入口",
};

export const MemberListMobile: Story = {
  ...MemberList,
  name: "待邀请成员列表（移动端）",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

export const Empty: Story = {
  name: "暂无待邀请成员",
  args: { placeholderMembers: [] },
};

export const InviteDialog: Story = {
  name: "邀请成员弹框（填写名字与权限）",
  play: async ({ canvasElement }) => {
    await openInviteDialog(canvasElement);
  },
};

export const InviteDialogMobile: Story = {
  ...InviteDialog,
  name: "邀请成员弹框（移动端）",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

export const InviteFailed: Story = {
  name: "邀请成员失败（同名）",
  args: {
    action: async () => ({
      error: "已有同名待邀请成员，请在列表中为 TA 生成邀请链接。",
      errorKey: "storybook-invite-failed",
      operation: "invite",
    }),
  },
  play: async ({ canvasElement }) => {
    await openInviteDialog(canvasElement);
    const body = within(document.body);
    await userEvent.type(await body.findByLabelText(/名字/), "奶奶");
    await userEvent.click(
      await body.findByRole("button", { name: "生成邀请链接" }),
    );
    await body.findByRole("heading", { name: "邀请成员失败" });
  },
};

export const LinkFailedPartially: Story = {
  name: "已添加但链接生成失败（部分成功）",
  args: {
    action: async () => ({
      error: "已添加「小明」，但邀请链接生成失败，请在列表中重新生成。",
      errorKey: "storybook-link-failed",
      operation: "invite",
    }),
  },
  play: InviteFailed.play,
};

export const CreatedLink: Story = {
  name: "邀请成功后在同一弹框显示链接与身份说明",
  args: { token: "storybook-invite-token" },
  play: async () => {
    // 模拟 Action 成功后的 fragment：新成员 ID 用于定位名字。
    window.history.replaceState(
      null,
      "",
      `#inviteId=storybook-invite&inviteRole=member&inviteToken=storybook-invite-token&placeholderId=${placeholderMembers[1].id}`,
    );
    window.dispatchEvent(new Event("hashchange"));
  },
};

export const CreatedLinkMobile: Story = {
  ...CreatedLink,
  name: "邀请成功（移动端）",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

export const BoundInviteCopyArea: Story = {
  name: "已生成链接：复制区域（身份说明）",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", {
        name: "奶奶，等待加入",
      }),
    );
    await userEvent.click(
      await within(document.body).findByRole("button", {
        name: /查看邀请链接/,
      }),
    );
  },
};

export const BoundInviteCopyAreaMobile: Story = {
  ...BoundInviteCopyArea,
  name: "已生成链接：复制区域（移动端）",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

export const RevokeConfirmation: Story = {
  name: "撤销链接确认",
  play: async (context) => {
    await BoundInviteCopyArea.play?.(context);
    const body = within(document.body);
    await userEvent.click(
      await body.findByRole("button", { name: "撤销邀请" }),
    );
    await body.findByRole("heading", { name: "确认撤销邀请？" });
  },
};

export const RegenerateLink: Story = {
  name: "未生成链接（含撤销后）：重新生成",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      await within(canvasElement).findByRole("button", {
        name: "爷爷，未生成链接",
      }),
    );
    await userEvent.click(
      await within(document.body).findByRole("button", {
        name: /生成专属邀请链接/,
      }),
    );
  },
};

export const ReadOnly: Story = {
  name: "普通成员只读（无邀请权限）",
  args: { canInvite: false, placeholderMemberActions: null },
};

export const ReadOnlyMobile: Story = {
  ...ReadOnly,
  name: "普通成员只读（移动端）",
  parameters: { viewport: { defaultViewport: "mobile2" } },
};
