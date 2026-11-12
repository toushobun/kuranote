import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  it("部分核销显示橙色状态标签，零金额不显示已退标签", () => {
    const { rerender } = render(
      <TransactionLinkCandidateCards
        candidates={[
          { ...candidate, amount: "100", refundedAmount: "40", remainingRefundableAmount: "60" },
        ]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("已退 ¥40")).toBeVisible();
    rerender(
      <TransactionLinkCandidateCards
        candidates={[
          { ...candidate, amount: "100", refundedAmount: "0", reimbursementAmount: "0", remainingRefundableAmount: "100" },
        ]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.queryByText(/已退 ¥0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/已报 ¥0/)).not.toBeInTheDocument();
  });

  it("全额退款与混合核销显示完成标签，金额置灰但仍可点选", () => {
    const onSelect = vi.fn();
    const fullySettled = {
      ...candidate,
      amount: "100",
      refundedAmount: "100",
      remainingRefundableAmount: "0",
    };
    const { rerender } = render(
      <TransactionLinkCandidateCards
        candidates={[fullySettled]}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("已全额退款")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /选择退款明细/ }));
    expect(onSelect).toHaveBeenCalledWith(fullySettled);
    rerender(
      <TransactionLinkCandidateCards
        candidates={[
          {
            ...fullySettled,
            refundedAmount: "60",
            reimbursementAmount: "40",
          },
        ]}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("已结清")).toBeVisible();
    expect(screen.queryByText("已退 ¥60")).not.toBeInTheDocument();
  });

  it("使用实时计算结果渲染，选择时仍保留数据库原始候选", () => {
    const onSelect = vi.fn();
    render(
      <TransactionLinkCandidateCards
        candidates={[candidate]}
        onSelect={onSelect}
        resolveLinkCandidate={(value) => ({
          ...value,
          refundedAmount: "250",
          remainingRefundableAmount: "3030",
        })}
      />,
    );
    expect(screen.getByText("已退 ¥250")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /选择退款明细/ }));
    expect(onSelect).toHaveBeenCalledWith(candidate);
  });

});
