import { fireEvent, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  clickCloseWizard,
  createLoadInviteMembersMock,
  finishInviteAndWait,
  renderLedgerSetupWizardAtInviteStep,
  waitForInviteEntry,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { createLedgerSetupConfirmProgressFixture } from "test/mocks/ledgerSetup";
import type { LedgerSetupInviteMembers } from "types/ledgers";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const twoPlaceholderMembers: LedgerSetupInviteMembers = {
  pendingInvites: [],
  placeholderMembers: [
    { displayName: "奶奶", id: "placeholder-1" },
    { displayName: "爷爷", id: "placeholder-2" },
  ],
};

/** 从确认一览完成创建，经过第 6 步进入完成页。 */
async function renderCompleteScreen(
  options: Parameters<typeof renderLedgerSetupWizardAtInviteStep>[0] = {},
) {
  const result = await renderLedgerSetupWizardAtInviteStep(options);
  await waitForInviteEntry();
  await finishInviteAndWait();
  return result;
}

function getSummary() {
  return screen.getByRole("region", { name: "已添加的内容" });
}

/** 摘要卡片中各项的「标签：数字」。 */
function getStats() {
  return within(getSummary())
    .getAllByRole("definition")
    .map(
      (count) => `${count.previousSibling?.textContent}:${count.textContent}`,
    );
}

describe("LedgerSetupCompleteScreen", () => {
  it("显示插画、标题与账本名", async () => {
    await renderCompleteScreen();

    expect(
      screen.getByRole("img", { name: "账本已准备好的插画" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "一切就绪！" }),
    ).toBeInTheDocument();
    expect(screen.getByText("「家庭账本」已经准备好了")).toBeInTheDocument();
    expect(screen.getByText("现在就开始记录第一笔吧")).toBeInTheDocument();
  });

  it("显示账户数、去重后的商家数与第 6 步最新读取的待邀请成员数", async () => {
    await renderCompleteScreen({
      loadInviteMembers: createLoadInviteMembersMock(twoPlaceholderMembers),
    });

    // 商家 fixture 中 Apple、Amazon 各属于两个标签，去重后为 5 家。
    expect(getStats()).toEqual(["账户:2", "商家:5", "待邀请成员:2"]);
  });

  it("数字为 0 的项目隐藏", async () => {
    await renderCompleteScreen({
      progress: createLedgerSetupConfirmProgressFixture({
        accounts: { items: [], skipped: true },
      }),
    });

    expect(getStats()).toEqual(["商家:5"]);
  });

  it("全部为 0 时不显示摘要卡片", async () => {
    await renderCompleteScreen({
      progress: createLedgerSetupConfirmProgressFixture({
        accounts: { items: [], skipped: true },
        merchants: { selectedKeys: ["aeon"], skipped: true },
      }),
    });

    expect(
      screen.queryByRole("region", { name: "已添加的内容" }),
    ).not.toBeInTheDocument();
  });

  it("「开始记账」先关闭向导再导航到记一笔", async () => {
    const { onClose } = await renderCompleteScreen();

    const link = screen.getByRole("link", { name: "开始记账" });
    expect(link).toHaveAttribute("href", "/transactions/new");

    fireEvent.click(link);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("「去首页看看」先关闭向导再导航到首页", async () => {
    const { onClose } = await renderCompleteScreen();

    const link = screen.getByRole("link", { name: "去首页看看" });
    expect(link).toHaveAttribute("href", "/dashboard");

    fireEvent.click(link);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("只保留「×」，点击后直接关闭向导", async () => {
    const { onClose } = await renderCompleteScreen();

    clickCloseWizard();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("dialog", { name: "稍后再继续？" }),
    ).not.toBeInTheDocument();
  });
});
