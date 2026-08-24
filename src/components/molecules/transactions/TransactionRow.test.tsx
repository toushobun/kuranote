import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type TransactionRowItem } from "types/transactions";
import { TransactionRow } from "./TransactionRow";
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
  it("显示商家名称", () => {
    render(<TransactionRow item={createItem()} />);
    expect(screen.getByText("便利店")).toBeInTheDocument();
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
    expect(screen.queryByText("未知商家")).toBeNull();
    expect(screen.queryByText("转账")).toBeNull();
    expect(screen.getByTestId("SyncAltIcon")).toBeInTheDocument();
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
  it("备注紧挨小分类显示在第三行", () => {
    render(<TransactionRow item={createItem({ note: "测试备注" })} />);
    expect(screen.getByText("餐饮 | 测试备注")).toBeInTheDocument();
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
    expect(screen.getByText("未知商家")).toBeInTheDocument();
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
  it("超过三项支出小分类时显示最高三项支出并追加总项数", () => {
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
    expect(screen.getByText("药品、日用品、餐饮等 4 项")).toBeInTheDocument();
  });
  it("超过三项收入小分类时显示最高三项收入并追加总项数", () => {
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
    expect(screen.getByText("工资、奖金、副业等 5 项")).toBeInTheDocument();
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
    expect(screen.getByText("工资等 4 项")).toBeInTheDocument();
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
  it("明细部分核销时显示净额和部分核销提示", () => {
    render(
      <TransactionRow
        item={createItem({
          account_currency: "USD",
          amount: "100",
          originalAmount: "150",
          categoryItems: [
            {
              amount: "150",
              businessNetAmount: "100",
              categoryName: "服装",
              categoryType: "expense",
              parentCategoryName: "购物",
              refundedAmount: "40",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("- $ 100")).toBeInTheDocument();
    expect(screen.getByText("部分已核销")).toHaveStyle({
      color: "rgba(0, 0, 0, 0.38)",
      fontWeight: "400",
    });
    expect(screen.queryByText(/^原金额/)).not.toBeInTheDocument();
  });

  it("记录内只有部分明细完全核销时显示统计净额和部分不计入提示", () => {
    render(
      <TransactionRow
        item={createItem({
          amount: "2000",
          originalAmount: "6000",
          categoryItems: [
            {
              amount: "4000",
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
    expect(screen.getByText("部分不计入支出")).toBeInTheDocument();
    expect(screen.queryByText("- ¥ 6,000")).not.toBeInTheDocument();
    expect(screen.queryByText(/^原金额/)).not.toBeInTheDocument();
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

  it("完全抵消的支出显示原始金额和不计入支出", () => {
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

    expect(screen.getByText("- $ 100")).toBeInTheDocument();
    expect(screen.getByText("不计入支出")).toBeInTheDocument();
    expect(screen.queryByText(/^原金额/)).not.toBeInTheDocument();
  });

  it("已核销的退款收入显示原始金额和不计入收入", () => {
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

    expect(screen.getByText("+ ¥ 2,000")).toBeInTheDocument();
    expect(screen.getByText("不计入收入")).toBeInTheDocument();
    expect(screen.queryByText(/^原金额/)).not.toBeInTheDocument();
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
    expect(screen.queryByText("不计入支出")).not.toBeInTheDocument();
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

  describe("业务标签", () => {
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

    it("存在核销结余明细且没有待报销时整行显示倒赚状态", () => {
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

      expect(screen.getByText("已倒赚")).toBeInTheDocument();
      expect(screen.queryByText("已结清")).not.toBeInTheDocument();
    });

    it("所有明细都没有业务状态时不显示业务标签", () => {
      render(
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
            ],
          })}
        />,
      );

      expect(screen.queryByText("退款收入")).not.toBeInTheDocument();
      expect(screen.queryByText("报销收入")).not.toBeInTheDocument();
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
describe("TransactionRow \u8BB0\u5F55\u4EBA\u5C55\u793A", () => {
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
    note: null,
    recorder_color: "amber",
    recorder_name: "淞文",
    transaction_at: "2026-06-05T03:20:10.000Z",
    type: "expense",
  };
  afterEach(() => {
    cleanup();
  });
  it("多人账本使用成员个性色显示账户和记录人", () => {
    render(<TransactionRow item={item} showAccount showRecorder />);
    expect(screen.getByText("日元现金")).toHaveStyle({
      color: themeColorTokens.sakura.chipText,
    });
    expect(screen.getByText("淞文")).toHaveStyle({
      color: themeColorTokens.amber.chipText,
    });
  });
  it("单人账本保留记录人数据但不显示昵称", () => {
    render(
      <TransactionRow item={{ ...item, show_recorder: false }} showRecorder />,
    );
    expect(screen.queryByText("淞文")).not.toBeInTheDocument();
  });
});
