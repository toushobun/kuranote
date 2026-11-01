import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { flowMessages as m } from "config/transactionStepFlowMessages";
import { SelectionSectionHeader } from "./SelectionSectionHeader";

const meta = {
  title: "Molecules/Transactions/SelectionSectionHeader",
  component: SelectionSectionHeader,
  args: { title: m.merchants, addLabel: m.addMerchant, onAdd: () => {} },
} satisfies Meta<typeof SelectionSectionHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Merchant: Story = {};
export const RecommendedAccounts: Story = {
  args: {
    title: m.recommended,
    hint: m.recommendationHint,
    addLabel: m.addAccount,
  },
};
export const WithoutPermission: Story = { args: { onAdd: undefined } };
