import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { itemsStepFixture, filledItems } from "test/mocks/transactionItemsStep";
import { TransactionStepItemsCard } from "./TransactionStepItemsCard";
const meta = {
  title: "Organisms/Transactions/TransactionStepItemsCard",
  component: TransactionStepItemsCard,
  args: {
    items: filledItems.map((item, index) => ({
      ...item,
      id: index + 1,
      category: itemsStepFixture.categoryOptions.find(
        (category) => category.id === item.categoryId,
      ),
    })),
    automaticItemIds: [],
    currency: "JPY",
    expenseTotal: 10000,
    incomeTotal: 0,
    hasCategoryOptions: true,
    onAdd: () => {},
    onEdit: () => {},
    onAmount: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof TransactionStepItemsCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Filled: Story = { name: "明细与合计" };
export const Empty: Story = { name: "空卡片", args: { items: [] } };
export const Automatic: Story = {
  name: "自动标签",
  args: { automaticItemIds: [1, 2] },
};
