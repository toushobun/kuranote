import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TransactionLinkCandidateCards } from "./TransactionLinkCandidateCards";
import {
  candidateItems,
  mixedMerchantItems,
} from "../TransactionLinkCandidatePanel/transactionLinkCandidateFixtures";
const meta = {
  title: "Organisms/Transactions/TransactionLinkCandidateCards",
  component: TransactionLinkCandidateCards,
  args: {
    candidates: candidateItems,
    selectedId: candidateItems[0].id,
    onSelect: () => undefined,
  },
} satisfies Meta<typeof TransactionLinkCandidateCards>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "单选候选卡片" };
export const MixedCurrencies1147: Story = {
  name: "不同币种原支出混排且可以选择",
  args: {
    candidates: [
      candidateItems[0],
      { ...candidateItems[1], accountCurrency: "CNY" },
      { ...candidateItems[2], accountCurrency: "USD" },
    ],
    selectedId: candidateItems[1].id,
  },
};

export const MixedMerchants: Story = {
  name: "多商家 · 同名支出可区分",
  args: {
    candidates: mixedMerchantItems,
  },
};
export const SingleMerchant: Story = {
  name: "单一商家 · 不重复商家名",
  args: { showMerchantName: false },
};

export const WithNote: Story = {
  name: "有备注 · 第三行单行展示",
  args: { candidates: [candidateItems[0]] },
};
export const WithoutNote: Story = {
  name: "无备注 · 维持原卡片高度",
  args: { candidates: [candidateItems[1]] },
};
export const LongNote: Story = {
  name: "长备注 · 单行省略",
  args: {
    candidates: [
      {
        ...candidateItems[0],
        note: "蓝牙音箱 JBL Flip 6 黑色，送朋友的生日礼物，请记得保存包装和购买小票".repeat(
          3,
        ),
      },
    ],
  },
};
export const LockedWithNote: Story = {
  name: "已在小票上 · 仍显示备注",
  args: {
    candidates: [candidateItems[0]],
    selectedId: null,
    lockedAmounts: new Map([[candidateItems[0].id, "500"]]),
  },
};
