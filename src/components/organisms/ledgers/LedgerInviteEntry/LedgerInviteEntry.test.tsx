import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LedgerInvitePendingProvider } from "organisms/ledgers/LedgerInvitePendingContext/LedgerInvitePendingContext";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import type {
  LedgerInviteActionState,
  LedgerInviteStateAction,
  LedgerPlaceholderMemberSummary,
  PendingLedgerInvite,
} from "types/ledgers";
import { LedgerInviteEntry } from "./LedgerInviteEntry";

const grandma = { displayName: "奶奶", id: "placeholder-1" };
const grandpa = { displayName: "爷爷", id: "placeholder-2" };
const boundInvite: PendingLedgerInvite = {
  createdAt: "2026-09-01T00:00:00.000Z",
  id: "invite-bound",
  placeholderId: grandma.id,
  role: "member",
  token: "bound-token",
};
const placeholderMemberActions = {
  delete: vi.fn(async () => ({})),
  rename: vi.fn(async () => ({})),
};
const createdFragment =
  "/ledgers/ledger-1/settings#inviteId=invite-1&inviteRole=member&inviteToken=invite-token";

type EntryData = {
  pendingInvites?: PendingLedgerInvite[];
  placeholderMembers?: LedgerPlaceholderMemberSummary[];
};

function renderEntry({
  action = vi.fn(async (state: LedgerInviteActionState) => state),
  canInvite = true,
  pendingInvites = [],
  placeholderMembers = [],
}: EntryData & {
  action?: LedgerInviteStateAction;
  canInvite?: boolean;
} = {}) {
  const view = (data: Required<EntryData>) => (
    <ConfirmDialogTestProviders>
      <LedgerInvitePendingProvider pendingInvites={data.pendingInvites}>
        <LedgerInviteEntry
          action={action}
          canInvite={canInvite}
          ledgerId="ledger-1"
          ledgerName="家庭账本"
          placeholderMemberActions={canInvite ? placeholderMemberActions : null}
          placeholderMembers={data.placeholderMembers}
        />
      </LedgerInvitePendingProvider>
    </ConfirmDialogTestProviders>
  );
  const result = render(view({ pendingInvites, placeholderMembers }));
  return {
    ...result,
    action,
    rerenderWith: (data: Required<EntryData>) => result.rerender(view(data)),
  };
}

function openInviteDialog() {
  fireEvent.click(screen.getByRole("button", { name: /^邀请成员/ }));
  return screen.getByRole("dialog", { name: /邀请成员/ });
}

function fillName(value: string) {
  fireEvent.change(screen.getByLabelText(/名字/), { target: { value } });
}

function lastFormData(action: ReturnType<typeof vi.fn>) {
  return action.mock.calls.at(-1)?.[1] as FormData;
}

/** 打开待邀请成员行 → 查看邀请链接，进入邀请详情。 */
function openBoundInviteDetails(name = "奶奶") {
  fireEvent.click(screen.getByRole("button", { name: `${name}，等待加入` }));
  fireEvent.click(screen.getByRole("button", { name: /查看邀请链接/ }));
  return screen.getByRole("dialog", { name: /邀请详情/ });
}

const writeText = vi.fn(async () => {});

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText } });
  window.history.replaceState(null, "", "/ledgers/ledger-1/settings");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LedgerInviteEntry 邀请成员入口", () => {
  it("只有一个邀请成员入口，没有添加待邀请成员入口", () => {
    renderEntry({ placeholderMembers: [grandma] });

    expect(screen.getAllByRole("button", { name: /^邀请成员/ })).toHaveLength(
      1,
    );
    expect(
      screen.getByText("填写名字，生成 TA 的专属邀请链接"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /添加待邀请成员/ })).toBeNull();
  });

  it("非管理者看到只读说明且入口不可用", () => {
    renderEntry({ canInvite: false });

    expect(screen.getByRole("button", { name: /^邀请成员/ })).toBeDisabled();
    expect(screen.getByText("仅管理员或所有者可以邀请成员")).toBeVisible();
  });

  it("弹框必须填写名字，默认 Member 且可切换 Admin", async () => {
    const { action } = renderEntry();
    const dialog = openInviteDialog();

    const nameField = within(dialog).getByLabelText(/名字/);
    expect(nameField).toBeRequired();
    expect(nameField).toHaveAttribute("name", "displayName");
    expect(nameField).toHaveAttribute("maxLength", "100");
    expect(dialog.querySelector('input[name="intent"]')).toHaveAttribute(
      "value",
      "invite",
    );
    expect(dialog.querySelector('input[name="placeholderId"]')).toBeNull();
    const roleButton = within(dialog).getByRole("button", {
      name: /选择邀请权限/,
    });
    expect(roleButton).toHaveTextContent("用户（Member）");
    expect(roleButton).toHaveAttribute("type", "button");
    fireEvent.click(roleButton);
    expect(screen.queryByText("所有者（Owner）")).not.toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "管理员（Admin）" }),
    );
    expect(screen.getByDisplayValue("admin")).toHaveAttribute("name", "role");
    expect(action).not.toHaveBeenCalled();
  });

  it("提交时带上名字、角色与 intent=invite", async () => {
    const { action } = renderEntry();
    openInviteDialog();
    fillName("小明");
    fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = lastFormData(action as ReturnType<typeof vi.fn>);
    expect(formData.get("intent")).toBe("invite");
    expect(formData.get("displayName")).toBe("小明");
    expect(formData.get("role")).toBe("member");
    expect(formData.get("ledgerId")).toBe("ledger-1");
  });

  it("失败时保留名字与权限，标题为邀请成员失败且 URL 不携带错误参数", async () => {
    const action = vi.fn(async () => ({
      error: "已有同名待邀请成员，请在列表中为 TA 生成邀请链接。",
      errorKey: "invite-error-1",
      operation: "invite" as const,
    }));
    renderEntry({ action });
    openInviteDialog();
    fillName("奶奶");
    fireEvent.click(screen.getByRole("button", { name: /选择邀请权限/ }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "管理员（Admin）" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));

    expect(await screen.findByText("邀请成员失败")).toBeInTheDocument();
    expect(
      screen.getByText("已有同名待邀请成员，请在列表中为 TA 生成邀请链接。"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/名字/)).toHaveValue("奶奶");
    expect(screen.getByDisplayValue("admin")).toHaveAttribute("name", "role");
    expect(window.location.search).toBe("");
    expect(window.location.href).not.toContain("errorKey");
  });

  it("相同错误使用新错误标识时会再次展示", async () => {
    let errorCount = 0;
    const action = vi.fn(async () => {
      errorCount += 1;
      return {
        error: "邀请链接生成失败，请稍后重试。",
        errorKey: `invite-error-${errorCount}`,
        operation: "invite" as const,
      };
    });
    renderEntry({ action });
    openInviteDialog();
    fillName("小明");
    fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));
    const firstAlert = await screen.findByRole("alert");
    expect(firstAlert).toHaveTextContent("邀请成员失败");
    fireEvent.click(within(firstAlert).getByRole("button", { name: "关闭" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("邀请成员失败");
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("页面刷新后不会重复展示已处理的 Action 错误", async () => {
    const action = vi.fn(async () => ({
      error: "邀请链接生成失败，请稍后重试。",
      errorKey: "invite-error-1",
      operation: "invite" as const,
    }));
    const { unmount } = renderEntry({ action });
    openInviteDialog();
    fillName("小明");
    fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));
    expect(await screen.findByText("邀请成员失败")).toBeInTheDocument();
    unmount();
    renderEntry({ action });
    expect(screen.queryByText("邀请成员失败")).not.toBeInTheDocument();
  });

  it("成功后按 fragment 定位新成员，同一弹框显示链接与身份说明", async () => {
    window.history.replaceState(
      null,
      "",
      `${createdFragment}&placeholderId=${grandpa.id}`,
    );
    renderEntry({ placeholderMembers: [grandma, grandpa] });

    const dialog = await screen.findByRole("dialog", {
      name: /邀请「爷爷」加入/,
    });
    expect(
      within(dialog).getByDisplayValue(/\/invite\/invite-token/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "邀请你以「爷爷」的身份加入账本。加入后，记在「爷爷」名下的账户与记录会归到你名下。",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/名字/)).toBeNull();
    expect(
      await screen.findByText("创建链接成功，快去复制给你的亲友吧"),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe("");
  });

  it("成功提示只显示一次并清理 fragment", async () => {
    window.history.replaceState(null, "", createdFragment);
    const { unmount } = renderEntry();
    expect(
      await screen.findByText("创建链接成功，快去复制给你的亲友吧"),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe("");
    unmount();
    renderEntry();
    expect(
      screen.queryByText("创建链接成功，快去复制给你的亲友吧"),
    ).not.toBeInTheDocument();
  });

  it("组件未重新挂载时仍会消费后续创建结果", async () => {
    renderEntry();
    window.history.pushState(
      null,
      "",
      "/ledgers/ledger-1/settings#inviteId=invite-2&inviteRole=admin&inviteToken=second-token",
    );
    fireEvent(window, new Event("hashchange"));
    expect(
      await screen.findByText("创建链接成功，快去复制给你的亲友吧"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/second-token/)).toBeInTheDocument();
    expect(screen.getByText("管理员（Admin）")).toBeInTheDocument();
    expect(window.location.hash).toBe("");
  });

  it("菜单、复制与关闭按钮不会提交表单", async () => {
    window.history.replaceState(null, "", createdFragment);
    const { action } = renderEntry();
    const copyButton = await screen.findByRole("button", { name: "复制" });
    const closeButton = screen.getByRole("button", { name: "关闭" });
    expect(copyButton).toHaveAttribute("type", "button");
    expect(closeButton).toHaveAttribute("type", "button");
    fireEvent.click(copyButton);
    fireEvent.click(closeButton);
    expect(action).not.toHaveBeenCalled();
  });

  it("复制成功后显示明确反馈", async () => {
    window.history.replaceState(null, "", createdFragment);
    renderEntry();
    fireEvent.click(await screen.findByRole("button", { name: "复制链接" }));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/invite/invite-token"),
    );
    expect(await screen.findByText("复制成功")).toBeInTheDocument();
  });

  it("复制失败时不显示成功提示", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    window.history.replaceState(null, "", createdFragment);
    renderEntry();
    fireEvent.click(await screen.findByRole("button", { name: "复制链接" }));
    expect(
      await screen.findByText("复制失败，请手动复制邀请链接"),
    ).toBeInTheDocument();
    expect(screen.queryByText("复制成功")).not.toBeInTheDocument();
  });

  it("再次点击邀请成员会清空旧链接、名字与反馈并恢复 Member", async () => {
    window.history.replaceState(
      null,
      "",
      "/ledgers/ledger-1/settings#inviteId=invite-1&inviteRole=admin&inviteToken=invite-token",
    );
    renderEntry();
    expect(await screen.findByDisplayValue(/invite-token/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    openInviteDialog();
    expect(
      screen.getByDisplayValue("生成后将在这里显示邀请链接"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/名字/)).toHaveValue("");
    expect(
      screen.getByRole("button", { name: /选择邀请权限/ }),
    ).toHaveTextContent("用户（Member）");
    expect(
      screen.getByRole("button", { name: "生成邀请链接" }),
    ).toHaveAttribute("type", "submit");
  });

  it("打开全新邀请草稿时清除旧撤销成功提示", async () => {
    window.history.replaceState(
      null,
      "",
      "/ledgers/ledger-1/settings?inviteResult=revoked",
    );
    renderEntry();
    expect(await screen.findByText("邀请已撤销")).toBeInTheDocument();
    openInviteDialog();
    await waitFor(() => {
      expect(screen.queryByText("邀请已撤销")).not.toBeInTheDocument();
    });
  });
});

describe("LedgerInviteEntry 待邀请成员", () => {
  it("成员区块只显示待邀请成员行，不再显示匿名或找不到占位的邀请", () => {
    renderEntry({
      pendingInvites: [
        boundInvite,
        { ...boundInvite, id: "invite-anonymous", placeholderId: null },
        { ...boundInvite, id: "invite-orphan", placeholderId: "missing" },
      ],
      placeholderMembers: [grandma, grandpa],
    });

    expect(
      screen.getByRole("button", { name: "奶奶，等待加入" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "爷爷，未生成链接" }),
    ).toBeVisible();
    expect(screen.queryByText("待接受邀请")).toBeNull();
    // 两个待邀请成员行 + 唯一的邀请成员入口。
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("已生成链接的行显示角色与创建时间", () => {
    renderEntry({
      pendingInvites: [{ ...boundInvite, role: "viewer" }],
      placeholderMembers: [grandma],
    });

    expect(screen.getByText(/^只读（Viewer） · /)).toBeInTheDocument();
  });

  it("非管理者只能看到占位摘要，没有管理入口也拿不到链接", () => {
    renderEntry({ canInvite: false, placeholderMembers: [grandma] });

    fireEvent.click(screen.getByRole("button", { name: "奶奶，待邀请" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("只有管理员或所有者可以管理待邀请成员。"),
    ).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("修改名字")).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: /生成专属邀请链接/ }),
    ).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: /删除待邀请成员/ }),
    ).toBeNull();
    // 不提供改角色、个性色等真实成员功能。
    expect(within(dialog).queryByText("成员权限")).toBeNull();
    expect(within(dialog).queryByText("当前账本个性色")).toBeNull();
  });

  it("已生成链接时可查看、复制链接与二维码，并显示带实时名字的身份说明", async () => {
    renderEntry({
      pendingInvites: [boundInvite],
      placeholderMembers: [grandma],
    });

    const details = openBoundInviteDetails();
    expect(within(details).getByText("等待接受")).toBeInTheDocument();
    expect(within(details).getByText("创建时间")).toBeInTheDocument();
    expect(
      within(details).getByDisplayValue(/\/invite\/bound-token/),
    ).toBeInTheDocument();
    expect(
      within(details).getByRole("img", { name: "账本邀请二维码，家庭账本" }),
    ).toHaveAttribute(
      "data-qr-value",
      expect.stringContaining("/invite/bound-token"),
    );
    expect(
      within(details).getByText(
        "邀请你以「奶奶」的身份加入账本。加入后，记在「奶奶」名下的账户与记录会归到你名下。",
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(details).getByRole("button", { name: "复制链接" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("/invite/bound-token"),
      ),
    );
  });

  it("撤销链接需要二次确认，并提交邀请 ID", () => {
    renderEntry({
      pendingInvites: [boundInvite],
      placeholderMembers: [grandma],
    });

    const details = openBoundInviteDetails();
    fireEvent.click(within(details).getByRole("button", { name: "撤销邀请" }));

    expect(
      screen.getByRole("heading", { name: "确认撤销邀请？" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByDisplayValue("invite-bound")
        .some((input) => input.getAttribute("name") === "inviteId"),
    ).toBe(true);
  });

  it("撤销失败时展示对应弹框且不打开邀请弹框", async () => {
    const action = vi.fn(async () => ({
      error: "该邀请链接已经被使用，无法撤销。",
      errorKey: "revoke-error-1",
      operation: "revoke" as const,
    }));
    renderEntry({
      action,
      pendingInvites: [boundInvite],
      placeholderMembers: [grandma],
    });

    const details = openBoundInviteDetails();
    fireEvent.click(within(details).getByRole("button", { name: "撤销邀请" }));
    fireEvent.click(screen.getByRole("button", { name: "确认撤销" }));

    expect(await screen.findByText("撤销邀请失败")).toBeInTheDocument();
    expect(
      screen.getByText("该邀请链接已经被使用，无法撤销。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /邀请成员/ })).toBeNull();
  });

  it("同页撤销成功后关闭旧弹窗并清理结果参数", async () => {
    renderEntry({
      pendingInvites: [boundInvite],
      placeholderMembers: [grandma],
    });

    const details = openBoundInviteDetails();
    fireEvent.click(within(details).getByRole("button", { name: "撤销邀请" }));
    window.history.pushState(
      null,
      "",
      "/ledgers/ledger-1/settings?inviteResult=revoked",
    );
    fireEvent(window, new Event("popstate"));

    expect(await screen.findByText("邀请已撤销")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "确认撤销邀请？" }),
      ).not.toBeInTheDocument();
    });
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("撤销后（刷新列表）行保留为未生成链接，可重新生成并提交 placeholderId", async () => {
    const { action, rerenderWith } = renderEntry({
      pendingInvites: [boundInvite],
      placeholderMembers: [grandma],
    });

    rerenderWith({ pendingInvites: [], placeholderMembers: [grandma] });
    fireEvent.click(screen.getByRole("button", { name: "奶奶，未生成链接" }));
    fireEvent.click(screen.getByRole("button", { name: /生成专属邀请链接/ }));

    const draft = screen.getByRole("dialog", { name: /邀请「奶奶」加入/ });
    expect(within(draft).queryByLabelText(/名字/)).toBeNull();
    fireEvent.click(
      within(draft).getByRole("button", { name: "生成邀请链接" }),
    );

    await waitFor(() => expect(action).toHaveBeenCalled());
    const formData = lastFormData(action as ReturnType<typeof vi.fn>);
    expect(formData.get("intent")).toBe("create");
    expect(formData.get("placeholderId")).toBe(grandma.id);
    expect(formData.get("displayName")).toBeNull();
  });

  it("重新生成失败时标题为生成邀请链接失败并保持弹框", async () => {
    const action = vi.fn(async () => ({
      error: "邀请链接生成失败，请稍后重试。",
      errorKey: "create-error-1",
      operation: "create" as const,
    }));
    renderEntry({ action, placeholderMembers: [grandma] });

    fireEvent.click(screen.getByRole("button", { name: "奶奶，未生成链接" }));
    fireEvent.click(screen.getByRole("button", { name: /生成专属邀请链接/ }));
    fireEvent.click(screen.getByRole("button", { name: "生成邀请链接" }));

    expect(await screen.findByText("生成邀请链接失败")).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /邀请「奶奶」加入/ }),
    ).toBeInTheDocument();
  });

  it("改名后刷新列表时行与身份说明使用新名字", () => {
    const { rerenderWith } = renderEntry({
      pendingInvites: [boundInvite],
      placeholderMembers: [grandma],
    });

    rerenderWith({
      pendingInvites: [boundInvite],
      placeholderMembers: [{ ...grandma, displayName: "外婆" }],
    });
    const details = openBoundInviteDetails("外婆");

    expect(
      within(details).getByText(/以「外婆」的身份加入账本/),
    ).toBeInTheDocument();
  });
});
