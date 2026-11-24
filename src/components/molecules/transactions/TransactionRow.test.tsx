import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { transactionFallbackLabels } from "internal/transaction";
import { type TransactionRowItem } from "types/transactions";
import { TransactionRow } from "./TransactionRow";
import {
  sharedPaymentAccountShareRowItem,
  sharedPaymentMatchedItemsRowItem,
  sharedPaymentRowItem,
  sharedPaymentWithOriginalAmountRowItem,
} from "./transactionRowSharedPayment.testUtils";
import { themeColorTokens } from "theme/themeColorTokens";

function incomeBusinessStatus(role: "refund" | "reimbursement") {
  return {
    incomeLinkRole: role,
    offsetComposition: { refundAmount: "0", reimbursementAmount: "0" },
    settlementStatus: null,
  } as const;
}

describe("TransactionRow", () => {
  const nativeDateTimeFormat = Intl.DateTimeFormat;
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
  function createItem(
    overrides: Partial<TransactionRowItem> = {},
  ): TransactionRowItem {
    return {
      id: "00000000-0000-4000-8000-000000009001",
      type: "expense",
      transaction_at: "2026-06-05T03:20:10.000Z",
      amount: "1234",
      account_name: "日元现金",
      account_currency: "JPY",
      categoryItems: [
        {
          amount: "1234",
          categoryName: "餐饮",
          parentCategoryName: "饮食",
          categoryType: "expense",
        },
      ],
      merchant_name: "便利店",
      merchant_icon_url: null,
      note: null,
      recorder_name: null,
      ...overrides,
    };
  }
  it.each([
    ["2500", "+ ¥ 2,500"],
    ["-2500", "- ¥ 2,500"],
  ])("余额调整展示有符号金额 %s 和备注", (amount, expected) => {
    render(
      <TransactionRow
        item={createItem({
          type: "balance_adjustment",
          amount,
          categoryItems: [],
          merchant_name: null,
          note: "盘点",
        })}
      />,
    );
    expect(screen.getByText("余额调整")).toBeInTheDocument();
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByText("日元现金")).toBeInTheDocument();
    expect(screen.getByText("盘点")).toBeInTheDocument();
    expect(
      screen.queryByText(transactionFallbackLabels.merchant),
    ).not.toBeInTheDocument();
  });
  it("显示商家名称", () => {
    render(<TransactionRow item={createItem()} />);
    expect(screen.getByText("便利店")).toBeInTheDocument();
  });
  it("商家名与金额使用统一行高并按基线对齐", () => {
    render(<TransactionRow item={createItem()} receiptCard />);
    const merchant = screen.getByText("便利店");
    const amount = screen.getByText("- ¥ 1,234");

    expect(merchant).toHaveStyle({ lineHeight: "1.15" });
    expect(amount).toHaveStyle({ lineHeight: "1.15" });
    expect(merchant.parentElement).toHaveStyle({ alignItems: "baseline" });
  });
  it("支出记录显示币种符号和负号金额", () => {
    render(<TransactionRow item={createItem()} />);
    expect(screen.getByText("- ¥ 1,234")).toBeInTheDocument();
  });
  it("收入记录显示对应币种符号和正号金额", () => {
    render(
      <TransactionRow
        item={createItem({
          account_currency: "USD",
          type: "income",
          amount: "260000",
        })}
      />,
    );
    expect(screen.getByText("+ $ 260,000")).toBeInTheDocument();
  });
  it("金额为 0 时仍显示记录金额", () => {
    render(<TransactionRow item={createItem({ amount: "0" })} />);
    expect(screen.getByText("¥ 0")).toBeInTheDocument();
  });
  it("转账记录显示账户周转和转账图标，且不显示类型标签", () => {
    render(
      <TransactionRow
        item={createItem({
          account_name: "日元现金 → 储蓄账户",
          categoryItems: [],
          merchant_icon_url: null,
          merchant_name: null,
          type: "transfer",
        })}
      />,
    );
    expect(screen.getByText("账户周转")).toBeInTheDocument();
    expect(screen.queryByText(transactionFallbackLabels.merchant)).toBeNull();
    expect(screen.queryByText("转账")).toBeNull();
    expect(screen.getByTestId("SyncAltIcon")).toBeInTheDocument();
  });
  it("跨币种无手续费时第一排并列转出与到账，第二排为空", () => {
    render(
      <TransactionRow
        item={createItem({
          type: "transfer",
          account_currency: "JPY",
          amount: "100000",
          categoryItems: [],
          merchant_name: null,
          merchant_icon_url: null,
          transferTargetAmount: "4850",
          transferTargetCurrency: "CNY",
        })}
        showAccount
        showTime
      />,
    );
    const amount = screen.getByText("¥ 100,000 → ¥4,850 CNY");
    const account = screen.getByText("日元现金");
    const secondRow = account.parentElement?.parentElement;
    expect(amount).toHaveStyle({ whiteSpace: "nowrap" });
    expect(secondRow).toHaveStyle({ flexDirection: "row", minHeight: "17px" });
    expect(secondRow?.contains(amount)).toBe(false);
    expect(screen.queryByText(/到账/)).not.toBeInTheDocument();
    expect(screen.queryByText(/手续费/)).not.toBeInTheDocument();
  });

  it("跨币种带手续费时第一排并列金额，手续费在第二排右侧", () => {
    render(
      <TransactionRow
        item={createItem({
          type: "transfer",
          account_currency: "JPY",
          amount: "100000",
          categoryItems: [],
          merchant_name: null,
          transferFeeAmount: "950",
          transferTargetAmount: "4850",
          transferTargetCurrency: "CNY",
        })}
        showAccount
        showTime
      />,
    );
    const amount = screen.getByText("¥ 100,000 → ¥4,850 CNY");
    const fee = screen.getByText("手续费 ¥950");
    const account = screen.getByText("日元现金");
    const secondRow = account.parentElement?.parentElement;
    expect(secondRow?.contains(fee)).toBe(true);
    expect(secondRow?.contains(amount)).toBe(false);
    expect(fee).toHaveClass("MuiTypography-noWrap");
    expect(fee).toHaveStyle({
      flexShrink: "0",
      fontSize: "11px",
      fontWeight: "400",
      lineHeight: "1.5",
      whiteSpace: "nowrap",
    });
    expect(fee.closest(".MuiChip-root")).toBeNull();
    expect(screen.queryByText(/到账/)).not.toBeInTheDocument();
  });

  it("同币种带手续费时金额仍单独显示，手续费占第二排右侧", () => {
    render(
      <TransactionRow
        item={createItem({
          type: "transfer",
          amount: "10000",
          categoryItems: [],
          merchant_name: null,
          transferFeeAmount: "220",
        })}
        showAccount
      />,
    );
    const amount = screen.getByText("¥ 10,000");
    const fee = screen.getByText("手续费 ¥220");
    const account = screen.getByText("日元现金");
    expect(account.parentElement?.parentElement?.contains(fee)).toBe(true);
    expect(amount).toBeInTheDocument();
    expect(fee.closest(".MuiChip-root")).toBeNull();
    expect(screen.queryByText(/到账/)).not.toBeInTheDocument();
  });

  it("无手续费的同币种转账也预留固定第二排行高", () => {
    render(
      <TransactionRow
        item={createItem({
          type: "transfer",
          amount: "1000",
          categoryItems: [],
          merchant_name: null,
          merchant_icon_url: null,
        })}
        showAccount
      />,
    );
    expect(screen.getByText("¥ 1,000")).toBeInTheDocument();
    expect(screen.queryByText(/到账|手续费/)).toBeNull();
    const account = screen.getByText("日元现金");
    expect(account.parentElement?.parentElement).toHaveStyle({
      minHeight: "17px",
    });
  });

  it("转账记录在第二行显示转出到账户摘要", () => {
    render(
      <TransactionRow
        item={createItem({
          account_name: "日元现金 → 储蓄账户",
          categoryItems: [],
          merchant_icon_url: null,
          merchant_name: null,
          type: "transfer",
        })}
        showAccount
      />,
    );
    expect(screen.getByText("日元现金 → 储蓄账户")).toBeInTheDocument();
  });
  it("备注从第二排移到第三排，与明细同排并以竖线分隔", () => {
    render(
      <TransactionRow
        item={createItem({ note: "测试备注" })}
        showAccount
        showTime
      />,
    );
    const metaRow = screen.getByText("日元现金").parentElement;
    const detailGroup = screen.getByText("餐饮").parentElement;
    const note = screen.getByText("测试备注");

    expect(metaRow).not.toContainElement(note);
    expect(metaRow?.textContent).not.toContain("测试备注");
    expect(detailGroup).toContainElement(note);
    expect(detailGroup?.textContent).toBe("餐饮|测试备注");
    expect(note).toHaveStyle({
      color: "var(--user-theme-tx-meta)",
      flex: "1",
      fontSize: "11px",
      minWidth: "0",
    });
  });

  it.each(["expense", "transfer"] as const)(
    "无分类的 %s 记录在第三排只显示备注",
    (type) => {
      render(
        <TransactionRow
          item={createItem({
            type,
            categoryItems: [],
            note: "独立备注",
          })}
          showAccount
          showTime
        />,
      );
      const note = screen.getByText("独立备注");
      expect(note.parentElement?.children).toHaveLength(1);
      expect(note.parentElement?.textContent).toBe("独立备注");
      expect(screen.getByText("日元现金").parentElement).not.toContainElement(
        note,
      );
    },
  );

  it("只有备注时渲染第三排，备注与标签都没有时不渲染", () => {
    const { container, rerender } = render(
      <TransactionRow item={createItem({ categoryItems: [], note: "仅备注" })} />,
    );
    expect(container.firstElementChild?.children).toHaveLength(2);
    expect(screen.getByText("仅备注")).toBeInTheDocument();

    rerender(
      <TransactionRow item={createItem({ categoryItems: [], note: null })} />,
    );
    expect(container.firstElementChild?.children).toHaveLength(1);
    expect(screen.queryByText("仅备注")).not.toBeInTheDocument();
  });

  it("明细备注与待报销标签同排且备注优先截断", () => {
    const status = {
      incomeLinkRole: null,
      offsetComposition: { refundAmount: "0", reimbursementAmount: "0" },
      settlementStatus: "pendingReimbursement",
    } as const;
    render(
      <TransactionRow
        item={createItem({
          note: "需要在月底交给公司办理费用报销的长备注",
          categoryItems: [
            {
              ...createItem().categoryItems[0],
              businessStatus: status,
            },
          ],
        })}
        showAccount
        showTime
      />,
    );
    const detail = screen.getByText("餐饮");
    const note = screen.getByText("需要在月底交给公司办理费用报销的长备注");
    const badge = screen.getByText("待报销").closest<HTMLElement>(".MuiChip-root");
    const textGroup = detail.parentElement;
    const detailRow = textGroup?.parentElement;

    expect(textGroup).toContainElement(note);
    expect(textGroup).toHaveStyle({ minWidth: "0", overflow: "hidden" });
    expect(detail).toHaveStyle({ flexShrink: "0", maxWidth: "100%" });
    expect(note).toHaveClass("MuiTypography-noWrap");
    expect(note).toHaveStyle({ flex: "1", minWidth: "0" });
    expect(detailRow?.lastElementChild).toContainElement(badge);
    expect(detailRow?.lastElementChild).toHaveStyle({ flexShrink: "0" });
  });
  it("第二行全部为空时不显示 meta 内容", () => {
    render(<TransactionRow item={createItem()} />);
    expect(screen.queryByText(/日元现金/)).toBeNull();
    expect(screen.queryByText(/12:20/)).toBeNull();
  });
  it("showAccount 为 true 时账户名称出现在第二行", () => {
    render(<TransactionRow item={createItem()} showAccount />);
    expect(screen.getByText(/日元现金/)).toBeInTheDocument();
  });
  it("服务端渲染时使用日本 fallback 时区显示时间", () => {
    const html = renderToString(
      <TransactionRow item={createItem()} showAccount showTime />,
    );
    expect(html).toContain("日元现金");
    expect(html).toContain("12:20");
  });
  it("客户端渲染时使用浏览器时区显示时间", () => {
    stubBrowserTimeZone("Asia/Shanghai");
    render(<TransactionRow item={createItem()} showAccount showTime />);
    expect(screen.getByText(/日元现金/)).toBeInTheDocument();
    expect(screen.getByText(/11:20/)).toBeInTheDocument();
  });
  it("merchant_name 为 null 时显示未知商家和问号头像", () => {
    render(<TransactionRow item={createItem({ merchant_name: null })} />);
    expect(
      screen.getByText(transactionFallbackLabels.merchant),
    ).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });
  it("两项小分类摘要显示全部小分类名", () => {
    render(
      <TransactionRow
        item={createItem({
          categoryItems: [
            {
              amount: "800",
              categoryName: "餐饮",
              parentCategoryName: "饮食",
              categoryType: "expense",
            },
            {
              amount: "1600",
              categoryName: "日用品",
              parentCategoryName: "购物",
              categoryType: "expense",
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("餐饮、日用品")).toBeInTheDocument();
  });
  it("三项小分类摘要显示全部小分类名", () => {
    render(
      <TransactionRow
        item={createItem({
          categoryItems: [
            {
              amount: "800",
              categoryName: "餐饮",
              parentCategoryName: "饮食",
              categoryType: "expense",
            },
            {
              amount: "1600",
              categoryName: "日用品",
              parentCategoryName: "购物",
              categoryType: "expense",
            },
            {
              amount: "500",
              categoryName: "交通",
              parentCategoryName: "出行",
              categoryType: "expense",
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("餐饮、日用品、交通")).toBeInTheDocument();
  });
  it("超过三项支出小分类时显示最高三项支出并追加等字", () => {
    render(
      <TransactionRow
        item={createItem({
          categoryItems: [
            {
              amount: "800",
              categoryName: "餐饮",
              parentCategoryName: "饮食",
              categoryType: "expense",
            },
            {
              amount: "1600",
              categoryName: "日用品",
              parentCategoryName: "购物",
              categoryType: "expense",
            },
            {
              amount: "500",
              categoryName: "交通",
              parentCategoryName: "出行",
              categoryType: "expense",
            },
            {
              amount: "2400",
              categoryName: "药品",
              parentCategoryName: "医疗",
              categoryType: "expense",
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("药品、日用品、餐饮等")).toBeInTheDocument();
  });
  it("超过三项收入小分类时显示最高三项收入并追加等字", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "320000",
          categoryItems: [
            {
              amount: "800",
              categoryName: "餐饮",
              parentCategoryName: "饮食",
              categoryType: "expense",
            },
            {
              amount: "260000",
              categoryName: "工资",
              parentCategoryName: "收入",
              categoryType: "income",
            },
            {
              amount: "30000",
              categoryName: "奖金",
              parentCategoryName: "收入",
              categoryType: "income",
            },
            {
              amount: "20000",
              categoryName: "副业",
              parentCategoryName: "收入",
              categoryType: "income",
            },
            {
              amount: "10000",
              categoryName: "利息",
              parentCategoryName: "收入",
              categoryType: "income",
            },
          ],
          type: "income",
        })}
      />,
    );
    expect(screen.getByText("工资、奖金、副业等")).toBeInTheDocument();
  });
  it("超过三项净收入但收入分类不足三项时只显示收入分类", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "250000",
          categoryItems: [
            {
              amount: "1000",
              categoryName: "餐饮",
              parentCategoryName: "饮食",
              categoryType: "expense",
            },
            {
              amount: "2000",
              categoryName: "交通",
              parentCategoryName: "出行",
              categoryType: "expense",
            },
            {
              amount: "3000",
              categoryName: "日用品",
              parentCategoryName: "购物",
              categoryType: "expense",
            },
            {
              amount: "260000",
              categoryName: "工资",
              parentCategoryName: "收入",
              categoryType: "income",
            },
          ],
          type: "income",
        })}
      />,
    );
    expect(screen.getByText("工资等")).toBeInTheDocument();
  });
  it("单条小分类摘要只显示小分类名", () => {
    render(<TransactionRow item={createItem()} />);
    expect(screen.getByText("餐饮")).toBeInTheDocument();
    expect(screen.queryByText("饮食 > 餐饮")).toBeNull();
    expect(screen.queryByText("餐饮等")).toBeNull();
  });
  it("长商家名仍可渲染", () => {
    render(
      <TransactionRow
        item={createItem({
          merchant_name: "很长很长很长很长很长的商家名称便利店",
        })}
      />,
    );
    expect(
      screen.getByText("很长很长很长很长很长的商家名称便利店"),
    ).toBeInTheDocument();
  });
  it("不显示删除按钮", () => {
    render(<TransactionRow item={createItem()} />);
    expect(screen.queryByRole("button", { name: "删除" })).toBeNull();
  });
  it("单条明细部分核销时显示净额和原金额", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "1099",
          originalAmount: "2000",
          categoryItems: [
            {
              amount: "2000",
              businessNetAmount: "1099",
              categoryName: "服装",
              categoryType: "expense",
              parentCategoryName: "购物",
              refundedAmount: "901",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("- ¥ 1,099")).toBeInTheDocument();
    expect(screen.getByText("原金额 - ¥ 2,000")).toBeInTheDocument();
    expect(screen.queryByText(/^部分/)).not.toBeInTheDocument();
  });

  it("多明细部分抵扣时显示净额和原金额", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "2000",
          originalAmount: "3000",
          categoryItems: [
            {
              amount: "1000",
              businessNetAmount: "0",
              categoryName: "交通",
              categoryType: "expense",
              parentCategoryName: "出行",
            },
            {
              amount: "2000",
              categoryName: "餐饮",
              categoryType: "expense",
              parentCategoryName: "饮食",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("- ¥ 2,000")).toBeInTheDocument();
    expect(screen.getByText("原金额 - ¥ 3,000")).toBeInTheDocument();
    expect(screen.queryByText(/^部分/)).not.toBeInTheDocument();
  });

  it("收入侧部分明细不计入时显示净额和原金额", () => {
    render(
      <TransactionRow
        item={createItem({
          type: "income",
          amount: "2000",
          originalAmount: "3000",
          categoryItems: [
            {
              amount: "1000",
              businessNetAmount: "0",
              categoryName: "退款",
              categoryType: "income",
              parentCategoryName: "其他收入",
            },
            {
              amount: "2000",
              categoryName: "奖金",
              categoryType: "income",
              parentCategoryName: "其他收入",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("+ ¥ 2,000")).toBeInTheDocument();
    expect(screen.getByText("原金额 + ¥ 3,000")).toBeInTheDocument();
    expect(screen.queryByText(/^部分/)).not.toBeInTheDocument();
  });

  it("原金额与业务净额方向相反时使用原金额自己的方向", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "400",
          originalAmount: "100",
          originalType: "income",
          type: "expense",
        })}
      />,
    );

    expect(screen.getByText("- ¥ 400")).toBeInTheDocument();
    expect(screen.getByText("原金额 + ¥ 100")).toBeInTheDocument();
  });

  it("完全抵消的支出显示净额和原金额", () => {
    render(
      <TransactionRow
        item={createItem({
          account_currency: "USD",
          amount: "0",
          originalAmount: "100",
          categoryItems: [
            {
              amount: "100",
              businessNetAmount: "0",
              categoryName: "服装",
              categoryType: "expense",
              parentCategoryName: "购物",
              refundedAmount: "100",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("$ 0")).toBeInTheDocument();
    expect(screen.getByText("原金额 - $ 100")).toBeInTheDocument();
  });

  it("超额退款主金额显示净收入，副标题保留原金额", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "1000",
          originalAmount: "1980",
          originalType: "income",
          type: "income",
          categoryItems: [
            {
              amount: "1980",
              businessNetAmount: "1000",
              businessStatus: {
                ...incomeBusinessStatus("refund"),
                surplusAmount: "1000",
              },
              categoryName: "退款",
              categoryType: "income",
              parentCategoryName: "特殊收入",
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("+ ¥ 1,000")).toBeVisible();
    expect(screen.getByText("原金额 + ¥ 1,980")).toBeVisible();
  });

  it("已核销的退款收入显示净额和原金额", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "0",
          originalAmount: "2000",
          originalType: "income",
          type: "income",
          categoryItems: [
            {
              amount: "2000",
              businessNetAmount: "0",
              businessStatus: incomeBusinessStatus("refund"),
              categoryName: "退款收入",
              categoryType: "income",
              parentCategoryName: "其他收入",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("¥ 0")).toBeInTheDocument();
    expect(screen.getByText("原金额 + ¥ 2,000")).toBeInTheDocument();
  });

  it("尚未核销的待报销支出仍计入支出", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "4000",
          categoryItems: [
            {
              amount: "4000",
              businessStatus: {
                incomeLinkRole: null,
                offsetComposition: {
                  refundAmount: "0",
                  reimbursementAmount: "0",
                },
                settlementStatus: "pendingReimbursement",
              },
              categoryName: "交通",
              categoryType: "expense",
              parentCategoryName: "出行",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("- ¥ 4,000")).toBeInTheDocument();
    expect(screen.queryByText(/^原金额/)).not.toBeInTheDocument();
  });

  it("没有抵消时不显示原金额文案", () => {
    render(
      <TransactionRow
        item={createItem({
          categoryItems: [
            {
              amount: "1234",
              categoryName: "餐饮",
              categoryType: "expense",
              parentCategoryName: "饮食",
              refundedAmount: "0",
            },
          ],
        })}
      />,
    );

    expect(screen.queryByText(/^原金额/)).not.toBeInTheDocument();
  });

  it("按账户实际收付显示且无原金额时不显示说明", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "1099",
          categoryItems: [
            {
              amount: "2000",
              businessNetAmount: "1099",
              categoryName: "服装",
              categoryType: "expense",
              parentCategoryName: "购物",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("- ¥ 1,099")).toBeInTheDocument();
    expect(screen.queryByText(/^原金额/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^部分/)).not.toBeInTheDocument();
  });

  describe("业务标签", () => {
    it("有无业务标签时分类和标签共用详情行且底部间距一致", () => {
      const detailText = "🥬 做饭食材/调料";
      render(
        <div>
          <div data-testid="category-only-row">
            <TransactionRow
              item={createItem({
                categoryItems: [
                  {
                    amount: "1234",
                    categoryName: detailText,
                    categoryType: "expense",
                    parentCategoryName: "饮食",
                  },
                ],
              })}
            />
          </div>
          <div data-testid="business-badge-row">
            <TransactionRow
              item={createItem({
                id: "00000000-0000-4000-8000-000000009002",
                categoryItems: [
                  {
                    amount: "1234",
                    businessStatus: incomeBusinessStatus("reimbursement"),
                    categoryName: detailText,
                    categoryType: "expense",
                    parentCategoryName: "饮食",
                  },
                ],
              })}
            />
          </div>
        </div>,
      );

      const summaries = screen.getAllByText(detailText);
      const plainRow = screen.getByTestId("category-only-row").children[0];
      const badgeRow = screen.getByTestId("business-badge-row").children[0];
      const plainGroup = summaries[0]?.parentElement?.parentElement;
      const badgeGroup = summaries[1]?.parentElement?.parentElement;
      const badgeSlot = badgeGroup?.children[1];
      const badge = screen.getByText("报销收入").closest(".MuiChip-root");

      expect(plainRow?.children).toHaveLength(2);
      expect(badgeRow?.children).toHaveLength(2);
      expect(plainRow).toHaveStyle({ paddingBottom: "6.4px" });
      expect(badgeRow).toHaveStyle({ paddingBottom: "6.4px" });
      expect(plainGroup).toHaveStyle({
        flexDirection: "row",
        minHeight: "20px",
      });
      expect(badgeGroup).toHaveStyle({
        flexDirection: "row",
        minHeight: "20px",
      });
      expect(plainGroup?.children).toHaveLength(1);
      expect(badgeGroup?.children).toHaveLength(2);
      expect(plainGroup?.children[0]).toContainElement(summaries[0]);
      expect(badgeGroup?.children[0]).toContainElement(summaries[1]);
      expect(badgeSlot).toHaveStyle({
        flexDirection: "row",
        flexShrink: "0",
        flexWrap: "nowrap",
        marginLeft: "auto",
      });
      expect(badgeSlot?.contains(badge)).toBe(true);
      summaries.forEach((summary) => {
        expect(summary.closest(".MuiChip-root")).toBeNull();
        expect(summary).toHaveClass("MuiTypography-noWrap");
        expect(summary).toHaveStyle({
          color: "var(--user-theme-tx-meta)",
          flexShrink: "0",
          fontSize: "11px",
          maxWidth: "100%",
        });
      });
      expect(badge).not.toBeNull();
    });

    it("只有标签没有分类文字时仍将标签靠右放在详情行", () => {
      render(
        <TransactionRow
          item={createItem({
            categoryItems: [
              {
                ...createItem().categoryItems[0],
                businessStatus: incomeBusinessStatus("refund"),
                categoryName: "",
              },
            ],
          })}
        />,
      );

      const badge = screen.getByText("退款收入").closest(".MuiChip-root");
      const badgeSlot = badge?.closest(".MuiStack-root")?.parentElement;
      const detailRow = badgeSlot?.parentElement;

      expect(badgeSlot).toHaveStyle({
        flexShrink: "0",
        marginLeft: "auto",
      });
      expect(detailRow?.children).toHaveLength(1);
      expect(detailRow).toHaveStyle({
        flexDirection: "row",
        minHeight: "20px",
      });
    });

    it("长分类保持省略且多个标签完整显示在同一行", () => {
      const categoryName = "特别长的退款收入明细分类名称需要在右侧标签前省略";
      render(
        <TransactionRow
          item={createItem({
            type: "income",
            amount: "1000",
            categoryItems: [
              {
                amount: "1980",
                businessStatus: {
                  ...incomeBusinessStatus("refund"),
                  surplusAmount: "1000",
                },
                categoryName,
                categoryType: "income",
                parentCategoryName: "特殊收入",
              },
            ],
          })}
        />,
      );

      const category = screen.getByText(categoryName);
      const badges = category.parentElement?.parentElement?.children[1];
      expect(category).toHaveClass("MuiTypography-noWrap");
      expect(category).toHaveStyle({ flexShrink: "0", maxWidth: "100%" });
      expect(category.parentElement).toHaveStyle({ overflow: "hidden" });
      expect(badges).toHaveStyle({
        flexShrink: "0",
        flexWrap: "nowrap",
      });
      expect(badges?.querySelectorAll(".MuiChip-root")).toHaveLength(2);
      expect(screen.getByText("退款收入")).toBeInTheDocument();
      expect(screen.getByText("倒赚 ¥1,000")).toBeInTheDocument();
    });

    it("单条明细带业务状态时显示对应标签", () => {
      render(
        <TransactionRow
          item={createItem({
            categoryItems: [
              {
                amount: "1234",
                businessStatus: incomeBusinessStatus("refund"),
                categoryName: "其他收入",
                categoryType: "income",
                parentCategoryName: "其他收入",
              },
            ],
          })}
        />,
      );

      expect(screen.getByText("退款收入")).toBeInTheDocument();
    });

    it("多条明细的业务状态重复时只显示一个标签", () => {
      render(
        <TransactionRow
          item={createItem({
            categoryItems: [
              {
                amount: "600",
                businessStatus: incomeBusinessStatus("reimbursement"),
                categoryName: "报销收入一",
                categoryType: "income",
                parentCategoryName: "其他收入",
              },
              {
                amount: "634",
                businessStatus: incomeBusinessStatus("reimbursement"),
                categoryName: "报销收入二",
                categoryType: "income",
                parentCategoryName: "其他收入",
              },
            ],
          })}
        />,
      );

      expect(screen.getAllByText("报销收入")).toHaveLength(1);
    });

    it("多条明细带不同业务状态时显示全部对应标签", () => {
      render(
        <TransactionRow
          item={createItem({
            categoryItems: [
              {
                amount: "600",
                businessStatus: incomeBusinessStatus("refund"),
                categoryName: "退款收入",
                categoryType: "income",
                parentCategoryName: "其他收入",
              },
              {
                amount: "634",
                businessStatus: incomeBusinessStatus("reimbursement"),
                categoryName: "报销收入",
                categoryType: "income",
                parentCategoryName: "其他收入",
              },
            ],
          })}
        />,
      );

      expect(screen.getByText("退款收入")).toBeInTheDocument();
      expect(screen.getByText("报销收入")).toBeInTheDocument();
    });

    it("多条支出按维度汇总核销金额且结算状态只显示一次", () => {
      render(
        <TransactionRow
          item={createItem({
            categoryItems: [
              {
                amount: "600",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "40",
                    reimbursementAmount: "0",
                  },
                  settlementStatus: "pendingReimbursement",
                },
                categoryName: "餐饮",
                categoryType: "expense",
                parentCategoryName: "饮食",
              },
              {
                amount: "634",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "60",
                    reimbursementAmount: "300",
                  },
                  settlementStatus: "pendingReimbursement",
                },
                categoryName: "交通",
                categoryType: "expense",
                parentCategoryName: "出行",
              },
            ],
          })}
        />,
      );

      expect(screen.getAllByText("待报销")).toHaveLength(1);
      expect(screen.getByText("退款核销 ¥100")).toBeInTheDocument();
      expect(screen.getByText("报销核销 ¥300")).toBeInTheDocument();
      expect(screen.queryByText("退款核销 ¥40")).not.toBeInTheDocument();
      expect(screen.queryByText("退款核销 ¥60")).not.toBeInTheDocument();
    });

    it("三位小数币种按币种精度汇总核销金额", () => {
      render(
        <TransactionRow
          item={createItem({
            account_currency: "KWD",
            categoryItems: [
              {
                amount: "1",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "0.001",
                    reimbursementAmount: "0",
                  },
                  settlementStatus: "pendingReimbursement",
                },
                categoryName: "餐饮",
                categoryType: "expense",
                parentCategoryName: "饮食",
              },
              {
                amount: "1",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "0.002",
                    reimbursementAmount: "0",
                  },
                  settlementStatus: "pendingReimbursement",
                },
                categoryName: "交通",
                categoryType: "expense",
                parentCategoryName: "出行",
              },
            ],
          })}
        />,
      );

      expect(screen.getByText("退款核销 KWD0.003")).toBeInTheDocument();
    });

    it("部分明细已结清、部分仍待报销时整行按待报销显示", () => {
      render(
        <TransactionRow
          item={createItem({
            categoryItems: [
              {
                amount: "600",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "600",
                    reimbursementAmount: "0",
                  },
                  settlementStatus: "reimbursed",
                },
                categoryName: "餐饮",
                categoryType: "expense",
                parentCategoryName: "饮食",
              },
              {
                amount: "634",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "0",
                    reimbursementAmount: "200",
                  },
                  settlementStatus: "pendingReimbursement",
                },
                categoryName: "交通",
                categoryType: "expense",
                parentCategoryName: "出行",
              },
            ],
          })}
        />,
      );

      expect(screen.getByText("待报销")).toBeInTheDocument();
      expect(screen.queryByText("已结清")).not.toBeInTheDocument();
    });

    it("原支出不存在已倒赚状态，超额时仍显示已结清", () => {
      render(
        <TransactionRow
          item={createItem({
            categoryItems: [
              {
                amount: "600",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "600",
                    reimbursementAmount: "0",
                  },
                  settlementStatus: "reimbursed",
                },
                categoryName: "餐饮",
                categoryType: "expense",
                parentCategoryName: "饮食",
              },
              {
                amount: "634",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "0",
                    reimbursementAmount: "1400",
                  },
                  settlementStatus: "reimbursementSurplus",
                },
                categoryName: "交通",
                categoryType: "expense",
                parentCategoryName: "出行",
              },
            ],
          })}
        />,
      );

      expect(screen.getByText("已结清")).toBeInTheDocument();
      expect(screen.queryByText("已倒赚")).not.toBeInTheDocument();
    });

    it("所有明细都没有业务状态时不渲染标签容器和额外间距", () => {
      const { container } = render(
        <TransactionRow
          item={createItem({
            categoryItems: [
              {
                amount: "600",
                businessStatus: null,
                categoryName: "餐饮",
                categoryType: "expense",
                parentCategoryName: "饮食",
              },
              {
                amount: "634",
                categoryName: "交通",
                categoryType: "expense",
                parentCategoryName: "出行",
              },
              {
                amount: "0",
                businessStatus: {
                  incomeLinkRole: null,
                  offsetComposition: {
                    refundAmount: "0",
                    reimbursementAmount: "0",
                  },
                  settlementStatus: null,
                },
                categoryName: "其他",
                categoryType: "expense",
                parentCategoryName: "其他",
              },
            ],
          })}
        />,
      );

      expect(screen.queryByText("退款收入")).not.toBeInTheDocument();
      expect(screen.queryByText("报销收入")).not.toBeInTheDocument();
      expect(container.firstElementChild?.children).toHaveLength(2);
    });
  });

  function stubBrowserTimeZone(timeZone: string) {
    const mockedIntl = Object.create(Intl) as typeof Intl;
    mockedIntl.DateTimeFormat = function DateTimeFormat(
      locales?: Intl.LocalesArgument,
      options?: Intl.DateTimeFormatOptions,
    ) {
      if (locales === undefined && options === undefined) {
        const formatter = new nativeDateTimeFormat();
        return {
          ...formatter,
          format: formatter.format.bind(formatter),
          resolvedOptions: () => ({
            ...formatter.resolvedOptions(),
            timeZone,
          }),
        };
      }
      return new nativeDateTimeFormat(locales, options);
    } as typeof Intl.DateTimeFormat;
    vi.stubGlobal("Intl", mockedIntl);
  }
});
describe("TransactionRow 共同支付", () => {
  afterEach(() => {
    cleanup();
  });

  it("多账户记录在账户行显示首个账户等 N 个账户，没有账户筛选时不显示共同支付行", () => {
    render(<TransactionRow item={sharedPaymentRowItem} showAccount />);

    expect(screen.getByText("我的账户 等 2 个账户")).toBeInTheDocument();
    expect(screen.getByText("- ¥ 120,000")).toBeInTheDocument();
    expect(screen.queryByText(/多账户 ·/)).not.toBeInTheDocument();
  });

  it("主金额为本账户份额时只显示整笔金额", () => {
    render(
      <TransactionRow item={sharedPaymentAccountShareRowItem} showAccount />,
    );

    expect(screen.getByText("- ¥ 50,000")).toBeInTheDocument();
    expect(screen.getByText("多账户 · 整笔 ¥120,000")).toBeInTheDocument();
    expect(screen.getByText("我的账户 等 2 个账户")).toBeInTheDocument();
  });

  it("主金额为命中明细全额时也只显示整笔金额，不显示份额", () => {
    render(<TransactionRow item={sharedPaymentMatchedItemsRowItem} />);

    expect(screen.getByText("- ¥ 80,000")).toBeInTheDocument();
    expect(screen.getByText("多账户 · 整笔 ¥120,000")).toBeInTheDocument();
    expect(screen.queryByText(/本账户/)).not.toBeInTheDocument();
  });

  it("共同支付行夹在当前金额和原金额之间", () => {
    render(<TransactionRow item={sharedPaymentWithOriginalAmountRowItem} />);

    const amount = screen.getByText("- ¥ 70,000");
    const sharedPayment = screen.getByText("多账户 · 整笔 ¥120,000");
    const originalAmount = screen.getByText("原金额 - ¥ 80,000");

    expect(
      amount.compareDocumentPosition(sharedPayment) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      sharedPayment.compareDocumentPosition(originalAmount) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("TransactionRow \u4E0D\u5C55\u793A\u8BB0\u8D26\u4EBA", () => {
  const item: TransactionRowItem = {
    account_color: "sakura",
    account_currency: "JPY",
    account_name: "日元现金",
    amount: "1200",
    categoryItems: [
      {
        amount: "1200",
        categoryName: "餐饮",
        categoryType: "expense",
        parentCategoryName: "饮食",
      },
    ],
    id: "00000000-0000-4000-8000-000000009001",
    merchant_icon_url: null,
    merchant_name: "便利店",
    note: "买菜",
    recorder_color: "amber",
    recorder_name: "淞文",
    transaction_at: "2026-06-05T03:20:10.000Z",
    type: "expense",
  };
  afterEach(() => {
    cleanup();
  });
  it("账户/时间行不再展示记账人，即使数据中存在", () => {
    render(<TransactionRow item={item} showAccount showTime />);
    expect(screen.getByText("日元现金")).toHaveStyle({
      color: themeColorTokens.sakura.chipText,
    });
    expect(screen.queryByText("淞文")).not.toBeInTheDocument();
  });
  it("账户与时间在第二排，备注与明细在第三排", () => {
    render(<TransactionRow item={item} showAccount showTime />);
    const account = screen.getByText("日元现金");
    const note = screen.getByText("买菜");
    const metaRow = account.parentElement;
    const detailGroup = screen.getByText("餐饮").parentElement;

    expect(metaRow?.textContent).toContain("日元现金");
    expect(metaRow?.textContent).toMatch(/日元现金\|\d{2}:\d{2}/);
    expect(metaRow).not.toContainElement(note);
    expect(detailGroup).toContainElement(note);
  });
});
