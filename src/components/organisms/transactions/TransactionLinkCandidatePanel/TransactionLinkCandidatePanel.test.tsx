import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionLinkCandidatePanel } from "./TransactionLinkCandidatePanel";
import {
  candidateRecords,
  candidateView,
  emptyCandidateView,
  loadCandidateView,
  selectedCandidate,
} from "./transactionLinkCandidateFixtures";

function renderPanel(
  props: Partial<
    React.ComponentProps<typeof TransactionLinkCandidatePanel>
  > = {},
) {
  return render(
    <TransactionLinkCandidatePanel
      accountCurrency="JPY"
      kind="refund"
      merchantId="amazon"
      merchantName="Amazon"
      loadInitialViewAction={loadCandidateView}
      onChange={vi.fn()}
      value={null}
      {...props}
    />,
  );
}
describe("TransactionLinkCandidatePanel", () => {
  afterEach(cleanup);
  it("商家卡片显示日期账户原金额和部分已退，单选可以切换", async () => {
    const onChange = vi.fn();
    const props = { onChange, value: selectedCandidate };
    const { rerender } = renderPanel(props);
    const first = await screen.findByRole("button", {
      name: "选择退款明细 USB-C 充电器",
    });
    expect(screen.getByText("Amazon 的支出")).toBeVisible();
    expect(screen.getByText("已退 ¥500")).toBeVisible();
    expect(screen.getByText("¥3,280")).toBeVisible();
    expect(first).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(
      screen.getByRole("button", { name: "选择退款明细 收纳盒" }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "item-2",
        remainingRefundableAmount: "1080",
      }),
    );
    rerender(
      <TransactionLinkCandidatePanel
        kind="refund"
        loadInitialViewAction={loadCandidateView}
        onChange={onChange}
        value={{ ...selectedCandidate, id: "item-2" }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "选择退款明细 收纳盒" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveAttribute("aria-pressed", "false");
  });
  it("商家没有候选时回退全部并改变标题", async () => {
    const loadInitial = vi
      .fn()
      .mockResolvedValueOnce(emptyCandidateView)
      .mockResolvedValueOnce(candidateView);
    renderPanel({ loadInitialViewAction: loadInitial });
    await screen.findByText("全部支出");
    expect(loadInitial).toHaveBeenNthCalledWith(1, "amazon");
    expect(loadInitial).toHaveBeenNthCalledWith(2);
    expect(await screen.findByText("收纳盒")).toBeVisible();
  });
  it("搜索跨商家，保留加载更多及失败重试", async () => {
    const loadSearch = vi
      .fn()
      .mockResolvedValueOnce({
        items: [candidateRecords[0]],
        nextOffset: 1,
        totalCount: 3,
      })
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue({
        items: [candidateRecords[1]],
        nextOffset: null,
        totalCount: 3,
      });
    renderPanel({ loadSearchPageAction: loadSearch });
    fireEvent.change(screen.getByRole("textbox", { name: "搜索原支出" }), {
      target: { value: "Amazon" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "加载更多" }));
    expect(loadSearch).toHaveBeenNthCalledWith(2, "Amazon", 1);
    fireEvent.click(
      await screen.findByRole("button", { name: "加载失败，点击重试" }),
    );
    await waitFor(() => expect(loadSearch).toHaveBeenCalledTimes(3));
  });
  it("浏览分页先读组内剩余再读后续分组，失败可重试", async () => {
    const loadItems = vi
      .fn()
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue({
        groups: [
          {
            ...candidateView.initialDateGroupsByGroupId.november[0],
            items: [candidateRecords[1]],
          },
        ],
        nextOffset: null,
      });
    const loadGroups = vi
      .fn()
      .mockResolvedValue({ groupBy: "month", groups: [], nextOffset: null });
    renderPanel({
      loadInitialViewAction: async () => ({
        ...candidateView,
        initialNextItemOffsetByGroupId: { november: 1 },
        nextOffset: 1,
      }),
      loadGroupItemsAction: loadItems,
      loadMoreGroupsAction: loadGroups,
    });
    fireEvent.click(await screen.findByRole("button", { name: "加载更多" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "加载失败，点击重试" }),
    );
    await waitFor(() => expect(loadItems).toHaveBeenCalledTimes(2));
    expect(loadItems).toHaveBeenLastCalledWith("2026-11", 1, "amazon");
    fireEvent.click(screen.getByRole("button", { name: "加载更多" }));
    await waitFor(() => expect(loadGroups).toHaveBeenCalledWith(1, "amazon"));
  });
});
