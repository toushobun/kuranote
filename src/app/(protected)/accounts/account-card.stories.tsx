import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountCard } from "./account-card";

const meta: Meta<typeof AccountCard> = {
  component: AccountCard,
  title: "Accounts/AccountCard",
};

export default meta;
type Story = StoryObj<typeof AccountCard>;

export const BankAccount: Story = {
  name: "银行账户",
  args: {
    name: "三菱UFJ银行",
    type: "bank",
    currency: "JPY",
    initialBalance: 100000,
    currentBalance: 85000,
  },
};

export const CreditCard: Story = {
  name: "信用卡",
  args: {
    name: "楽天カード",
    type: "credit_card",
    currency: "JPY",
    initialBalance: 0,
    currentBalance: -12500,
  },
};

export const EMoney: Story = {
  name: "电子钱包",
  args: {
    name: "PayPay",
    type: "e_money",
    currency: "JPY",
    initialBalance: 0,
    currentBalance: 3200,
  },
};

export const Cash: Story = {
  name: "现金",
  args: {
    name: "财布",
    type: "cash",
    currency: "JPY",
    initialBalance: 10000,
    currentBalance: 4560,
  },
};
