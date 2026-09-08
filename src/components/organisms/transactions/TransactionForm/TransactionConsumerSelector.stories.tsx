import Box from "@mui/material/Box";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { TransactionConsumerOption } from "types/transactions";

import { TransactionConsumerProvider } from "./TransactionConsumerContext";
import { TransactionConsumerSelector } from "./TransactionConsumerSelector";

const recorderId = "00000000-0000-4000-8000-000000000001";
const partnerId = "00000000-0000-4000-8000-000000000002";
const childId = "00000000-0000-4000-8000-000000000003";

const consumerOptions: TransactionConsumerOption[] = [
  { color: "amber", id: recorderId, name: "淞文" },
  { color: "sakura", id: partnerId, name: "秋爽" },
  { color: "sky", id: childId, name: "宝宝" },
];

const meta = {
  title: "Organisms/Transactions/TransactionConsumerSelector",
  component: TransactionConsumerSelector,
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 420, p: 3 }}>
        <form>
          <Story />
        </form>
      </Box>
    ),
  ],
} satisfies Meta<typeof TransactionConsumerSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultiMemberLedger: Story = {
  name: "多人账本默认折叠",
  decorators: [
    (Story) => (
      <TransactionConsumerProvider
        value={{ consumerOptions, recorderUserId: recorderId }}
      >
        <Story />
      </TransactionConsumerProvider>
    ),
  ],
};

export const RecorderIsConsumer: Story = {
  name: "记录人即消费者",
  decorators: [
    (Story) => (
      <TransactionConsumerProvider
        value={{
          consumerOptions,
          initialConsumerUserIds: [recorderId],
          recorderUserId: recorderId,
        }}
      >
        <Story />
      </TransactionConsumerProvider>
    ),
  ],
};

export const MultipleConsumers: Story = {
  name: "多个消费者自动展开",
  decorators: [
    (Story) => (
      <TransactionConsumerProvider
        value={{
          consumerOptions,
          initialConsumerUserIds: [partnerId, childId],
          recorderUserId: recorderId,
        }}
      >
        <Story />
      </TransactionConsumerProvider>
    ),
  ],
};

export const SingleMemberHidden: Story = {
  name: "单人账本隐藏",
  decorators: [
    (Story) => (
      <TransactionConsumerProvider
        value={{
          consumerOptions: [consumerOptions[0]!],
          recorderUserId: recorderId,
        }}
      >
        <Story />
      </TransactionConsumerProvider>
    ),
  ],
};
