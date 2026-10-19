import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  sharedPaymentAccountGroupRowItems,
  sharedPaymentCategoryGroupRowItems,
} from "molecules/transactions/transactionRowSharedPayment.testUtils";
import type {
  TransactionGroupSummaryItem,
  TransactionListItem,
  TransactionRowItem,
  TransactionTimeGroupViewData,
} from "types/transactions";

import { TransactionMonthList } from "./TransactionMonthList";

function createItem(
  index: number,
  overrides: Partial<TransactionListItem> = {},
): TransactionListItem {
  const isExpense = index % 4 !== 0;
  const amount = String(isExpense ? 800 + index * 120 : 120000);

  return {
    account_currency: "JPY",
    account_name: index % 2 === 0 ? "日元现金" : "Debit",
    amount,
    categoryItems: [
      {
        amount,
        categoryName: isExpense ? "餐饮" : "工资",
        categoryType: isExpense ? "expense" : "income",
        parentCategoryName: isExpense ? "饮食" : null,
      },
    ],
    created_at: new Date(Date.UTC(2026, 4, 29, 3, 0, index)).toISOString(),
    id: `00000000-0000-4000-8000-${String(910000 + index).padStart(12, "0")}`,
    merchant_icon_url: null,
    merchant_name: isExpense ? "便利店" : "共達",
    note: index % 3 === 0 ? `Storybook 月度记录 #${index}` : null,
    recorder_name: null,
    transaction_at: new Date(
      Date.UTC(2026, 4, index <= 3 ? 29 : 28, 3 + index, 15, 0),
    ).toISOString(),
    type: isExpense ? "expense" : "income",
    ...overrides,
  };
}

const currentMonthGroup = createMonthGroup({
  balance: "-3120",
  expense: "3120",
  income: "0",
  key: "2026-05",
  label: "2026年5月",
  transactionCount: 3,
});
const previousMonthGroup = createMonthGroup({
  balance: "258600",
  expense: "1400",
  income: "260000",
  key: "2026-04",
  label: "2026年4月",
  transactionCount: 2,
});

const timeGroupView: TransactionTimeGroupViewData = {
  groupBy: "month",
  groups: [currentMonthGroup, previousMonthGroup],
  initialDateGroupsByGroupId: {
    [currentMonthGroup.id]: [
      {
        date: "2026-05-29",
        items: [createItem(1), createItem(2), createItem(3)],
        label: "29日（周五）",
        summary: {
          balance: "-3120",
          currency: "JPY",
          expense: "3120",
          income: "0",
        },
      },
      {
        date: "2026-05-28",
        items: [
          createItem(4, {
            amount: "260000",
            categoryItems: [
              {
                amount: "260000",
                categoryName: "工资",
                categoryType: "income",
                parentCategoryName: null,
              },
            ],
            merchant_name: "共達",
            type: "income",
          }),
          createItem(5),
        ],
        label: "28日（周四）",
        summary: {
          balance: "258600",
          currency: "JPY",
          expense: "1400",
          income: "260000",
        },
      },
    ],
  },
  initialExpandedGroupId: currentMonthGroup.id,
  initialNextItemOffsetByGroupId: {
    [currentMonthGroup.id]: null,
  },
  nextOffset: null,
};

const emptyTimeGroupView: TransactionTimeGroupViewData = {
  ...timeGroupView,
  groups: [],
  initialDateGroupsByGroupId: {},
  initialExpandedGroupId: null,
  initialNextItemOffsetByGroupId: {},
};

// 医院 12 万（我 5 万、妻子 7 万）所在组的组头与组内行；行金额与组合计一致。
function createSharedPaymentGroupView({
  groupBy,
  groups,
}: {
  groupBy: TransactionTimeGroupViewData["groupBy"];
  groups: Array<{
    key: string;
    label: string;
    row: TransactionRowItem;
    sharedPayment?: TransactionGroupSummaryItem["sharedPayment"];
  }>;
}): TransactionTimeGroupViewData {
  const summaryGroups = groups.map(({ key, label, row, sharedPayment }) => ({
    id: `${groupBy}:${key}`,
    key,
    label,
    ...(sharedPayment ? { sharedPayment } : {}),
    summary: {
      balance: `-${row.amount}`,
      currency: "JPY",
      expense: row.amount,
      income: "0",
    },
    transactionCount: 1,
  }));

  return {
    ...emptyTimeGroupView,
    groupBy,
    groups: summaryGroups,
    initialDateGroupsByGroupId: Object.fromEntries(
      groups.map(({ row }, index) => [
        summaryGroups[index].id,
        [
          {
            date: "2026-10-10",
            items: [
              createItem(1, {
                ...row,
                note: null,
                recorder_name: null,
              }),
            ],
            label: "10日（周六）",
            summary: summaryGroups[index].summary,
          },
        ],
      ]),
    ),
    initialExpandedGroupId: summaryGroups[0]?.id ?? null,
  };
}

// 筛选我的账户 + 按分类：明细全额计入各分类组，组头与行都显示「本账户 / 整笔」。
const sharedPaymentTimeGroupView = createSharedPaymentGroupView({
  groupBy: "category",
  groups: [
    {
      key: "inpatient",
      label: "住院费",
      row: sharedPaymentCategoryGroupRowItems.inpatient,
    },
    {
      key: "treatment",
      label: "治疗费",
      row: sharedPaymentCategoryGroupRowItems.treatment,
    },
  ].map((group) => ({
    ...group,
    sharedPayment: {
      accountShareAmount: "50000",
      recordCount: 1,
      recordTotalAmount: "120000",
    },
  })),
});

// 无筛选 + 按账户：各账户组按实际付款计入，组内行显示该账户的付款金额与整笔。
const sharedPaymentAccountGroupView = createSharedPaymentGroupView({
  groupBy: "account",
  groups: [
    {
      key: "account-mine",
      label: "我的账户",
      row: sharedPaymentAccountGroupRowItems.mine,
    },
    {
      key: "account-wife",
      label: "妻子账户",
      row: sharedPaymentAccountGroupRowItems.wife,
    },
  ],
});

async function loadGroupItemsAction() {
  return { groups: [], nextOffset: null };
}

async function loadMoreGroupsAction() {
  return { groupBy: "month" as const, groups: [], nextOffset: null };
}

function createMonthGroup({
  balance,
  expense,
  income,
  key,
  label,
  transactionCount,
}: {
  balance: string;
  expense: string;
  income: string;
  key: string;
  label: string;
  transactionCount: number;
}): TransactionGroupSummaryItem {
  return {
    id: `month:${key}`,
    key,
    label,
    summary: {
      balance,
      currency: "JPY",
      expense,
      income,
    },
    transactionCount,
  };
}

const meta = {
  title: "Organisms/Transactions/TransactionMonthList",
  component: TransactionMonthList,
  args: {
    loadGroupItemsAction,
    loadMoreGroupsAction,
    timeGroupView,
  },
} satisfies Meta<typeof TransactionMonthList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "同日、跨日与跨月分组边界",
};

export const SharedPaymentGroupSummary: Story = {
  name: "筛选账户 + 按分类：组头与组内行金额一致",
  args: {
    timeGroupView: sharedPaymentTimeGroupView,
  },
};

export const SharedPaymentAccountGroup: Story = {
  name: "按账户分组：组内行为该账户的付款金额",
  args: {
    timeGroupView: sharedPaymentAccountGroupView,
  },
};

export const Empty: Story = {
  args: {
    timeGroupView: emptyTimeGroupView,
  },
};
