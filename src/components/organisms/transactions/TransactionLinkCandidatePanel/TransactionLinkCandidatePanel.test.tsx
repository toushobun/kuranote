import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";
import { TransactionOffsetEntryContext } from "../TransactionOffsetEntry/TransactionOffsetEntry";
import type { TransactionOffsetEntry } from "internal/transaction";
import {
  candidateItems,
  candidatePage,
  merchantPriorityItems,
  loadCandidatePage,
  offPageCandidate,
} from "./transactionLinkCandidateFixtures";

const visibleCallbacks: Array<
  (entries: { isIntersecting: boolean }[]) => void
> = [];

function observeNextPage() {
  const callback = visibleCallbacks.at(-1);
  expect(callback).toBeDefined();
  act(() => callback?.([{ isIntersecting: true }]));
}

function renderPanel(
  props: Partial<ComponentProps<typeof TransactionLinkCandidatePanel>> = {},
  source: TransactionOffsetEntry | null = null,
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
  return render(
    <TransactionOffsetEntryContext.Provider value={source}>
      <Harness />
    </TransactionOffsetEntryContext.Provider>,
  );
}
function toggleSettled(count: number) {
  const name = `已结清的支出（${count} 笔）`;
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("TransactionLinkCandidatePanel", () => {
  beforeEach(() => {
    visibleCallbacks.length = 0;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          callback: (entries: { isIntersecting: boolean }[]) => void,
        ) {
          visibleCallbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
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
    expect(
      screen.getByRole("button", { name: "Amazon的支出（3 笔）" }),
    ).toHaveAttribute("aria-expanded", "true");
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
  it("新增时点击候选只改变选中样式，原有顺序保持不变", async () => {
    renderPanel();
    await screen.findByText("USB-C 充电器");
    const names = () =>
      screen
        .getAllByRole("button", { name: /选择退款明细/ })
        .map((card) => card.getAttribute("aria-label"));
    const initialNames = names();
    fireEvent.click(
      screen.getByRole("button", {
        name: "选择退款明细 收纳盒",
      }),
    );
    expect(names()).toEqual(initialNames);
    expect(
      screen.getByRole("button", {
        name: "选择退款明细 收纳盒",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(
      screen.getByRole("button", {
        name: "选择退款明细 咖啡豆 2 袋",
      }),
    );
    expect(names()).toEqual(initialNames);
  });

  it("草稿候选的重筛支持备注、账户与大小分类", async () => {
    const affected = {
      ...candidateItems[0],
      id: "draft-outside-page",
      merchantId: "outside",
      merchantName: "另一家",
      note: "蓝牙音箱限量版",
      accountName: "家庭信用卡",
      categoryName: "电子配件",
      parentCategoryName: "日常购物",
    };
    const loadPage = vi.fn(async () => ({
      items: [],
      nextOffset: null,
      settledCount: 0,
      historyMerchantIds: [],
    }));
    renderPanel({
      linkAffectedCandidates: [affected],
      loadPageAction: loadPage,
    });
    await screen.findByRole("button", { name: "选择退款明细 电子配件" });
    for (const query of ["限量版", "家庭信用卡", "电子配件", "日常购物"]) {
      fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
        target: { value: query },
      });
      await waitFor(() =>
        expect(loadPage).toHaveBeenLastCalledWith(
          expect.objectContaining({ query }),
        ),
      );
      expect(
        screen.getByRole("button", { name: "选择退款明细 电子配件" }),
      ).toBeInTheDocument();
    }
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
  it("当前商家没有记录时仍一次读取全部商家候选", async () => {
    const other = {
      ...candidateItems[0],
      merchantId: "lawson",
      merchantName: "罗森",
    };
    const loadPage = vi.fn().mockResolvedValue({
      items: [other],
      nextOffset: null,
      settledCount: 0,
    });
    renderPanel({
      merchantId: "no-records",
      merchantName: "新商家",
      loadPageAction: loadPage,
    });
    await screen.findByText("USB-C 充电器");
    expect(screen.getByText("罗森 · 11/08 · 乐天信用卡")).toBeVisible();
    expect(loadPage).toHaveBeenCalledExactlyOnceWith({
      offset: 0,
      query: "",
      merchantId: "no-records",
      currency: "JPY",
    });
    expect(
      screen.queryByRole("button", { name: "加载更多" }),
    ).not.toBeInTheDocument();
  });
  it("已选商家候选在前但仍显示其他商家", async () => {
    const loadPage = vi.fn().mockResolvedValue({
      items: [merchantPriorityItems[1], merchantPriorityItems[0]],
      nextOffset: null,
      settledCount: 0,
    });
    renderPanel({ loadPageAction: loadPage });
    await screen.findByRole("button", { name: "其他支出（1 笔）" });
    fireEvent.click(screen.getByRole("button", { name: "其他支出（1 笔）" }));
    const cards = screen.getAllByRole("button", {
      name: /选择退款明细/,
    });
    expect(cards[0]).toHaveAccessibleName("选择退款明细 咖啡豆 2 袋");
    expect(cards[1]).toHaveAccessibleName("选择退款明细 USB-C 充电器");
  });
  it("小票实时关联的页外同商家候选仍排在其他商家前面", async () => {
    const currentMerchant = {
      ...candidateItems[1],
      id: "related-current-merchant",
      merchantId: "amazon",
      merchantName: "Amazon",
      categoryName: "实时关联的旧支出",
      transactionAt: "2026-10-20T10:00:00.000Z",
    };
    const other = {
      ...candidateItems[0],
      merchantId: "lawson",
      merchantName: "罗森",
    };
    renderPanel({
      linkAffectedCandidates: [currentMerchant],
      loadPageAction: vi.fn().mockResolvedValue({
        items: [other],
        nextOffset: null,
        settledCount: 0,
      }),
    });
    await screen.findByText("实时关联的旧支出");
    fireEvent.click(screen.getByRole("button", { name: "其他支出（1 笔）" }));
    const cards = screen.getAllByRole("button", {
      name: /选择退款明细/,
    });
    expect(cards[0]).toHaveAccessibleName("选择退款明细 实时关联的旧支出");
    expect(cards[1]).toHaveAccessibleName("选择退款明细 USB-C 充电器");
  });
  it("历史商家排在同商家之前，已添加的候选在原位置锁定", async () => {
    const historical = {
      ...offPageCandidate,
      remainingRefundableAmount: "1080",
    };
    const onChange = vi.fn();
    renderPanel({
      onChange,
      lockedAmounts: new Map([[historical.id, "750"]]),
      resolveLinkCandidate: (candidate) =>
        candidate.id === historical.id
          ? { ...candidate, remainingRefundableAmount: "0" }
          : candidate,
      loadPageAction: vi.fn().mockResolvedValue({
        items: [candidateItems[0], historical],
        historyMerchantIds: [historical.merchantId],
        nextOffset: null,
      }),
    });
    const lockedGroup = await screen.findByRole("button", {
      name: "已在小票上（1 笔）",
    });
    expect(lockedGroup).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(lockedGroup);
    await screen.findByText("已在小票上 · ¥750");
    const cards = screen.getAllByRole("button", { name: /选择退款明细/ });
    expect(cards[0]).toHaveAccessibleName("选择退款明细 往年差旅支出");
    expect(cards[0]).toBeDisabled();
    fireEvent.click(cards[0]);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(cards[1]);
    expect(onChange).toHaveBeenCalledWith(candidateItems[0]);
  });

  it("报销只请求一次并传入用于查询历史的商家", async () => {
    const loadPage = vi.fn().mockResolvedValue(candidatePage);
    renderPanel({ kind: "reimbursement", loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    expect(loadPage).toHaveBeenCalledExactlyOnceWith({
      offset: 0,
      query: "",
      merchantId: "amazon",
      currency: "JPY",
    });
    expect(
      screen.getByRole("button", { name: "其他待报销（3 笔）" }),
    ).toBeVisible();
    expect(screen.getByText("Amazon · 11/08 · 乐天信用卡")).toBeVisible();
  });
  it("编辑打开时的页外原支出固定置顶，分页去重且改选后不跳动", async () => {
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
    await screen.findByText("USB-C 充电器");
    observeNextPage();
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
    expect(cards[0]).toHaveAccessibleName("选择退款明细 往年差旅支出");
    expect(cards[0]).toHaveAttribute("aria-pressed", "false");
    expect(cards[2]).toHaveAccessibleName("选择退款明细 咖啡豆 2 袋");
    expect(cards[2]).toHaveAttribute("aria-pressed", "true");
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
        merchantId: "amazon",
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
    await screen.findByText("USB-C 充电器");
    observeNextPage();
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

  it("已结清列表展开后滚动触底自动读取下一页", async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [candidateItems[0]],
        nextOffset: null,
        settledCount: 2,
      })
      .mockResolvedValueOnce({
        items: [candidateItems[3]],
        nextOffset: 1,
        settledCount: 2,
      })
      .mockResolvedValueOnce({
        items: [
          {
            ...candidateItems[3],
            id: "second-settled",
            categoryName: "已结清耳机",
          },
        ],
        nextOffset: null,
        settledCount: 2,
      });
    renderPanel({ loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    toggleSettled(2);
    await screen.findByText("外套");
    observeNextPage();
    await screen.findByText("已结清耳机");
    expect(loadPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        offset: 1,
        settled: true,
        merchantId: "amazon",
      }),
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
    const name = "选择退款明细 外套";
    fireEvent.click(screen.getByRole("button", { name }));
    await waitFor(() => {
      const selected = screen.getByRole("button", { name });
      expect(selected).toHaveAttribute("aria-pressed", "true");
    });
    // 新选中已结清的候选仍留在已结清组内，不扣减折叠数量。
    expect(
      screen.getByRole("button", { name: "已结清的支出（1 笔）" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(loadPage).toHaveBeenCalledTimes(2);
  });

  it("已结清改用统一分组标题，不再使用虚线按钮", async () => {
    renderPanel();
    const collapsed = await screen.findByRole("button", {
      name: "已结清的支出（1 笔）",
    });
    expect(collapsed).toHaveAttribute("aria-expanded", "false");
    expect(collapsed).not.toHaveStyle({ borderStyle: "dashed" });
    expect(collapsed).toHaveTextContent("展开");
    toggleSettled(1);
    expect(collapsed).toHaveAttribute("aria-expanded", "true");
    expect(collapsed).toHaveTextContent("收起");
  });

  it("置顶已结清原支出从折叠数量中扣除，避免展开后笔数不一致", async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [candidateItems[0]],
        nextOffset: null,
        settledCount: 2,
      })
      .mockResolvedValueOnce({
        items: [
          candidateItems[3],
          {
            ...candidateItems[3],
            id: "another-settled",
            categoryName: "已退清的耳机",
          },
        ],
        nextOffset: null,
        settledCount: 2,
      });
    renderPanel({ value: candidateItems[3], loadPageAction: loadPage });
    await screen.findByRole("button", {
      name: "已结清的支出（1 笔）",
    });
    expect(screen.getAllByText("外套")).toHaveLength(1);
    toggleSettled(1);
    await screen.findByText("已退清的耳机");
    expect(screen.getAllByText("外套")).toHaveLength(1);
  });

  it("搜索不匹配置顶的结清候选时只扣除搜索范围内的数量", async () => {
    const other = {
      ...candidateItems[3],
      id: "other-settled",
      categoryName: "运动鞋",
    };
    const loadPage = vi.fn(
      async (input: Parameters<typeof loadCandidatePage>[0]) => {
        const filtered = input.query ? [other] : [candidateItems[3], other];
        return {
          items: input.settled ? filtered : [],
          nextOffset: null,
          settledCount: filtered.length,
        };
      },
    );
    renderPanel({ value: candidateItems[3], loadPageAction: loadPage });
    await screen.findByRole("button", { name: "已结清的支出（1 笔）" });
    fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
      target: { value: "运动鞋" },
    });
    await waitFor(() =>
      expect(loadPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: "运动鞋" }),
      ),
    );
    expect(
      await screen.findByRole("button", { name: "已结清的支出（1 笔）" }),
    ).toBeInTheDocument();
  });

  it("搜索结果也将结清候选单独折叠", async () => {
    const loadPage = vi.fn(loadCandidatePage);
    renderPanel({ loadPageAction: loadPage });
    await screen.findByText("USB-C 充电器");
    fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
      target: { value: "外套" },
    });
    await waitFor(() =>
      expect(loadPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ query: "外套" }),
      ),
    );
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
  it("默认只展开第一个可选组，锁定和已结清默认折叠", async () => {
    const locked = candidateItems[0];
    renderPanel({
      lockedAmounts: new Map([[locked.id, "100"]]),
      loadPageAction: vi.fn().mockResolvedValue({
        items: [locked, candidateItems[1], candidateItems[2]],
        nextOffset: null,
        settledCount: 1,
        historyMerchantIds: [],
        groupCounts: { history: 0, sameMerchant: 3, other: 0 },
      }),
    });
    const lockedHeader = await screen.findByRole("button", {
      name: "已在小票上（1 笔）",
    });
    expect(lockedHeader).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("USB-C 充电器")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Amazon的支出（2 笔）" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "已结清的支出（1 笔）" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(lockedHeader);
    expect(lockedHeader).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "选择退款明细 USB-C 充电器" }),
    ).toBeDisabled();
    fireEvent.click(lockedHeader);
    expect(lockedHeader).toHaveAttribute("aria-expanded", "false");
  });

  it("搜索时取消分组，清空搜索后按默认规则重新展开", async () => {
    renderPanel();
    const group = await screen.findByRole("button", {
      name: "Amazon的支出（3 笔）",
    });
    fireEvent.click(group);
    expect(group).toHaveAttribute("aria-expanded", "false");
    fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
      target: { value: "收纳盒" },
    });
    await screen.findByRole("button", { name: "选择退款明细 收纳盒" });
    expect(screen.queryByText("全部支出")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Amazon的支出/ }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
      target: { value: "" },
    });
    const restored = await screen.findByRole("button", {
      name: "Amazon的支出（3 笔）",
    });
    expect(restored).toHaveAttribute("aria-expanded", "true");
  });

  it("直接展开未加载的后组，顺序继续分页直到有卡片，并保持手动展开", async () => {
    const history = {
      ...candidateItems[0],
      merchantId: "lawson",
      merchantName: "罗森",
    };
    const second = {
      ...candidateItems[1],
      merchantId: "lawson",
      merchantName: "罗森",
    };
    const other = {
      ...candidateItems[2],
      merchantId: "family",
      merchantName: "全家",
    };
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [history],
        nextOffset: 1,
        settledCount: 0,
        historyMerchantIds: ["lawson"],
        groupCounts: { history: 2, sameMerchant: 0, other: 1 },
      })
      .mockResolvedValueOnce({ items: [second], nextOffset: 2 })
      .mockResolvedValueOnce({ items: [other], nextOffset: null });
    renderPanel({ loadPageAction: loadPage });
    const otherHeader = await screen.findByRole("button", {
      name: "其他支出（1 笔）",
    });
    expect(otherHeader).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(otherHeader);
    await screen.findByText("收纳盒");
    expect(loadPage).toHaveBeenCalledTimes(3);
    expect(loadPage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ offset: 1 }),
    );
    expect(loadPage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ offset: 2 }),
    );
    expect(otherHeader).toHaveAttribute("aria-expanded", "true");
  });

  it("编辑初始选中项置顶于所有组之上，服务端组计数扣除该项", async () => {
    renderPanel({
      value: candidateItems[0],
      loadPageAction: vi.fn().mockResolvedValue({
        items: candidateItems.slice(0, 3),
        nextOffset: null,
        settledCount: 0,
        groupCounts: { history: 0, sameMerchant: 3, other: 0 },
      }),
    });
    await screen.findByRole("button", { name: "Amazon的支出（2 笔）" });
    const cards = screen.getAllByRole("button", { name: /选择退款明细/ });
    expect(cards[0]).toHaveAccessibleName("选择退款明细 USB-C 充电器");
    expect(cards).toHaveLength(3);
  });

  it("入口 B 来源归在这笔记录，已在小票上的分组仍默认折叠", async () => {
    const sourceCandidate = {
      ...candidateItems[0],
      id: "source-item",
      merchantId: "lawson",
      merchantName: "罗森",
    };
    const locked = candidateItems[1];
    renderPanel(
      {
        lockedAmounts: new Map([[locked.id, "500"]]),
        loadPageAction: vi.fn().mockResolvedValue({
          items: [locked, sourceCandidate],
          nextOffset: null,
          settledCount: 0,
          historyMerchantIds: [],
          groupCounts: { history: 0, sameMerchant: 1, other: 1 },
        }),
      },
      {
        kind: "refund",
        accountId: "credit",
        merchantId: "amazon",
        candidates: [sourceCandidate],
      },
    );
    expect(
      await screen.findByRole("button", { name: "已在小票上（1 笔）" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "这笔记录（1 笔）" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("USB-C 充电器")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /其他支出/ }),
    ).not.toBeInTheDocument();
  });
});
