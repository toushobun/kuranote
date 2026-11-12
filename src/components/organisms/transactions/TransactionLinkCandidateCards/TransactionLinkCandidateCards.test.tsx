import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionLinkCandidateCards } from "./TransactionLinkCandidateCards";
import { candidateItems } from "../TransactionLinkCandidatePanel/transactionLinkCandidateFixtures";

const candidate = {
  ...candidateItems[0],
  merchantName: "全家",
  merchantIconUrl: "/merchant-logo.png",
  accountName: "招行信用卡",
  transactionAt: "2026-11-10T16:30:00Z",
};
describe("TransactionLinkCandidateCards", () => {
  afterEach(cleanup);
  it("跨商家副标题显示商家和账户，跨午夜日期与项目东京时区一致", () => {
    const { container } = render(
      <TransactionLinkCandidateCards
        candidates={[candidate]}
        onSelect={vi.fn()}
        selectedId={candidate.id}
      />,
    );
    expect(screen.getByText("全家 · 11/11 · 招行信用卡")).toBeVisible();
    expect(
      container.querySelector(`img[src="${candidate.merchantIconUrl}"]`),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
  it("单一商家列表可隐藏重复商家名，未指定商家时显示集中定义的文案", () => {
    const { rerender } = render(
      <TransactionLinkCandidateCards
        candidates={[candidate]}
        onSelect={vi.fn()}
        showMerchantName={false}
      />,
    );
    expect(screen.getByText("11/11 · 招行信用卡")).toBeVisible();
    rerender(
      <TransactionLinkCandidateCards
        candidates={[{ ...candidate, merchantName: null }]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("未指定商家 · 11/11 · 招行信用卡")).toBeVisible();
  });
});
