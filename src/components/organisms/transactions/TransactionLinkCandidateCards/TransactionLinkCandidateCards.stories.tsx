import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TransactionLinkCandidateCards } from "./TransactionLinkCandidateCards";
import { candidateItems } from "../TransactionLinkCandidatePanel/transactionLinkCandidateFixtures";
const meta = {
  title: "Organisms/Transactions/TransactionLinkCandidateCards",
  component: TransactionLinkCandidateCards,
  args: {
    candidates: candidateItems,
    selectedId: candidateItems[0].id,
    selectableCurrency: "JPY",
    onSelect: () => undefined,
  },
} satisfies Meta<typeof TransactionLinkCandidateCards>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "单选候选卡片" };
export const CurrencyDisabled: Story = {
  name: "币种不同不可选",
  args: { selectableCurrency: "USD" },
};
