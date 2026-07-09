import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { CurrentLedger } from "lib/ledger/current-ledger";

import { LedgersTemplate } from "./Ledgers";

const ledgers: CurrentLedger[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "家庭账本",
    baseCurrency: "JPY",
    currentUserRole: "owner",
    memberCount: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "旅行账本",
    baseCurrency: "JPY",
    currentUserRole: "admin",
    memberCount: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "育儿账本",
    baseCurrency: "JPY",
    currentUserRole: "member",
    memberCount: 2,
  },
];

const meta = {
  title: "Templates/Ledgers/LedgersTemplate",
  component: LedgersTemplate,
  args: {
    currentLedgerId: "00000000-0000-4000-8000-000000000001",
    ledgers,
  },
} satisfies Meta<typeof LedgersTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "账本管理页",
};

export const SingleLedger: Story = {
  name: "仅一个账本",
  args: {
    ledgers: [ledgers[0]],
  },
};

export const EmptyTemplateOnly: Story = {
  name: "无账本空状态（组件确认用）",
  args: {
    currentLedgerId: "",
    ledgers: [],
  },
};
