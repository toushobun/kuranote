import Stack from "@mui/material/Stack";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditTransactionActionButton } from "./EditTransactionActionButton";

const meta = {
  title: "Molecules/Transactions/EditTransactionActionButton",
  component: EditTransactionActionButton,
  args: { children: "保存修改" },
} satisfies Meta<typeof EditTransactionActionButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Actions: Story = {
  name: "保存与删除",
  render: () => (
    <Stack spacing={1.5}>
      <EditTransactionActionButton type="submit">
        保存修改
      </EditTransactionActionButton>
      <EditTransactionActionButton variant="outlined" color="error">
        删除
      </EditTransactionActionButton>
    </Stack>
  ),
};
export const Saving: Story = { name: "保存中", args: { loading: true } };
export const Disabled: Story = { name: "禁止保存", args: { disabled: true } };
