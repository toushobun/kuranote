import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";
import {
  candidateItems,
  candidatePage,
  emptyCandidatePage,
  loadCandidatePage,
  offPageCandidate,
} from "./transactionLinkCandidateFixtures";

function renderPanel(
  props: Partial<ComponentProps<typeof TransactionLinkCandidatePanel>> = {},
) {
  function Harness() {
    const [value, setValue] = useState(props.value ?? null);
    return (
      <TransactionLinkCandidatePanel
        accountCurrency="JPY"
        kind="refund"
        merchantId="amazon"
        merchantName="Amazon"
        loadPageAction={loadCandidatePage}
        {...props}
        value={value}
        onChange={(item) => {
          setValue(item);
          props.onChange?.(item);
        }}
      />
    );
  }
  return render(<Harness />);
}
function toggleSettled(count: number) {
  const name = `已结清的支出（${count} 笔）`;
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("TransactionLinkCandidatePanel", () => {
  afterEach(cleanup);
  it("打开只有一次分页请求，显示商家候选和部分已退", async () => {
    const loadPage = vi.fn().mockResolvedValue(candidatePage);
    renderPanel({ loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    expect(loadPage).toHaveBeenCalledExactlyOnceWith({
      offset: 0,
      query: "",
      merchantId: "amazon",
      currency: "JPY",
    });
    expect(screen.getByText("Amazon 的支出")).toBeVisible();
    expect(screen.getByText("11/08 · 乐天信用卡")).toBeVisible();
    expect(screen.getByText("已退 ¥500")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "选择退款明细 收纳盒" }),
    );
    expect(
      screen
        .getAllByRole("radio")
        .filter((radio) => (radio as HTMLInputElement).checked),
    ).toHaveLength(1);
  });
  it("未选账户时不传币种过滤，异币种候选可直接选择", async () => {
    const onChange = vi.fn();
    const loadPage = vi.fn().mockResolvedValue({
      items: [
        candidateItems[0],
        { ...candidateItems[1], accountCurrency: "USD" },
      ],
      nextOffset: null,
    });
    renderPanel({
      accountCurrency: undefined,
      loadPageAction: loadPage,
      onChange,
    });
    await screen.findByText("咖啡豆 2 袋");
    expect(loadPage).toHaveBeenCalledWith(
      expect.objectContaining({ currency: undefined }),
    );
    const usdCandidate = screen.getByRole("button", {
      name: "选择退款明细 咖啡豆 2 袋",
    });
    expect(usdCandidate).not.toBeDisabled();
    fireEvent.click(usdCandidate);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ accountCurrency: "USD" }),
    );
  });
  it("商家没有候选最多请求两次，回退全部并改标题", async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce(emptyCandidatePage)
      .mockResolvedValueOnce(candidatePage);
    renderPanel({ loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    expect(screen.getByText("全部支出")).toBeVisible();
    expect(screen.getByText("Amazon · 11/08 · 乐天信用卡")).toBeVisible();
    expect(loadPage).toHaveBeenCalledTimes(2);
    expect(loadPage).toHaveBeenLastCalledWith({
      offset: 0,
      query: "",
      currency: "JPY",
    });
  });
  it("报销只有一次请求且不携带商家筛选", async () => {
    const loadPage = vi.fn().mockResolvedValue(candidatePage);
    renderPanel({ kind: "reimbursement", loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    expect(loadPage).toHaveBeenCalledExactlyOnceWith({
      offset: 0,
      query: "",
      merchantId: undefined,
      currency: "JPY",
    });
    expect(screen.getByText("待报销")).toBeVisible();
    expect(screen.getByText("Amazon · 11/08 · 乐天信用卡")).toBeVisible();
  });
  it("已关联的页外原支出置顶，后续页去重，改选后置顶新候选", async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [candidateItems[0]], nextOffset: 1 })
      .mockResolvedValueOnce({
        items: [offPageCandidate, candidateItems[1]],
        nextOffset: null,
      });
    renderPanel({ value: offPageCandidate, loadPageAction: loadPage });
    const old = screen.getByRole("button", {
      name: "选择退款明细 往年差旅支出",
    });
    expect(old).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(await screen.findByRole("button", { name: "加载更多" }));
    await screen.findByText("咖啡豆 2 袋");
    expect(loadPage).toHaveBeenLastCalledWith({
      offset: 1,
      query: "",
      merchantId: "amazon",
      currency: "JPY",
    });
    expect(screen.getAllByText("往年差旅支出")).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("button", { name: "选择退款明细 咖啡豆 2 袋" }),
    );
    const cards = screen.getAllByRole("button", { name: /选择退款明细/ });
    expect(cards[0]).toHaveAccessibleName("选择退款明细 咖啡豆 2 袋");
    expect(cards[0]).toHaveAttribute("aria-pressed", "true");
    expect(old).toHaveAttribute("aria-pressed", "false");
  });
  it("搜索跨商家并保留已选卡片", async () => {
    const loadPage = vi.fn().mockResolvedValue(candidatePage);
    renderPanel({ value: offPageCandidate, loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
      target: { value: "收纳" },
    });
    await waitFor(() =>
      expect(loadPage).toHaveBeenLastCalledWith({
        offset: 0,
        query: "收纳",
        merchantId: undefined,
        currency: "JPY",
      }),
    );
    expect(
      screen.getByRole("button", { name: "选择退款明细 往年差旅支出" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("加载更多失败可重试同一个 offset，保持已有候选", async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [candidateItems[0]], nextOffset: 1 })
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue({ items: [candidateItems[1]], nextOffset: null });
    renderPanel({ loadPageAction: loadPage });
    fireEvent.click(await screen.findByRole("button", { name: "加载更多" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "加载失败，点击重试" }),
    );
    await screen.findByText("咖啡豆 2 袋");
    expect(screen.getByText("USB-C 充电器")).toBeVisible();
    expect(loadPage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ offset: 1 }),
    );
  });

  it("默认隐藏已结清候选，展开时才额外请求，仍可以选中", async () => {
    const loadPage = vi.fn(loadCandidatePage);
    renderPanel({ loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    expect(screen.queryByText("外套")).not.toBeInTheDocument();
    expect(loadPage).toHaveBeenCalledTimes(1);
    toggleSettled(1);
    await screen.findByText("外套");
    expect(loadPage).toHaveBeenCalledTimes(2);
    expect(loadPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 0, settled: true }),
    );
    const settledCard = screen.getByRole("button", {
      name: "选择退款明细 外套",
    });
    fireEvent.click(settledCard);
    expect(settledCard).toHaveAttribute("aria-pressed", "true");
    toggleSettled(1);
    expect(loadPage).toHaveBeenCalledTimes(2);
  });

  it("搜索结果也将结清候选单独折叠", async () => {
    const loadPage = vi.fn(loadCandidatePage);
    renderPanel({ loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
      target: { value: "外套" },
    });
    await screen.findByRole("button", { name: "已结清的支出（1 笔）" });
    expect(screen.queryByText("外套")).not.toBeInTheDocument();
    toggleSettled(1);
    await screen.findByText("外套");
    expect(loadPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: "外套", settled: true }),
    );
  });

  it("商家只有已结清原支出时不回退到全部商家", async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [],
      nextOffset: null,
      settledCount: 1,
    });
    renderPanel({ loadPageAction: loadPage, merchantId: "amazon" });
    await screen.findByRole("button", { name: "已结清的支出（1 笔）" });
    expect(loadPage).toHaveBeenCalledTimes(1);
  });

  it("小票未保存的核销变化可把服务端已结清候选提升到未结清列表", async () => {
    const candidate = candidateItems[3];
    renderPanel({
      linkAffectedCandidates: [candidate],
      resolveLinkCandidate: (item) =>
        item.id === candidate.id
          ? { ...item, remainingRefundableAmount: "200" }
          : item,
    });
    await screen.findByText("外套");
    expect(
      screen.getByRole("button", { name: "选择退款明细 外套" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /已结清的支出/ }),
    ).not.toBeInTheDocument();
  });

  it("小票未保存的核销可将原本有剩余的候选移入折叠并调整数量", async () => {
    const candidate = candidateItems[0];
    renderPanel({
      linkAffectedCandidates: [candidate],
      resolveLinkCandidate: (item) =>
        item.id === candidate.id
          ? {
              ...item,
              refundedAmount: item.amount,
              remainingRefundableAmount: "0",
            }
          : item,
    });
    await screen.findByText("收纳盒");
    expect(
      screen.queryByRole("button", { name: "选择退款明细 USB-C 充电器" }),
    ).not.toBeInTheDocument();
    toggleSettled(2);
    await screen.findByText("USB-C 充电器");
  });
});
