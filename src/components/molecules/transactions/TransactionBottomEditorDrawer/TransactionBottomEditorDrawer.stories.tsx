import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { TransactionBottomEditorDrawer } from "./TransactionBottomEditorDrawer";
import { flowMessages as m } from "config/transactionStepFlowMessages";
const meta = {
  title: "Molecules/Transactions/TransactionBottomEditorDrawer",
  component: TransactionBottomEditorDrawer,
  args: { open: true, title: m.note, onClose: () => {}, children: null },
} satisfies Meta<typeof TransactionBottomEditorDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Note: Story = {
  name: "共用底部编辑抽屉",
  render: function NoteDrawer(args) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>{m.note}</Button>
        <TransactionBottomEditorDrawer
          {...args}
          open={open}
          onClose={() => setOpen(false)}
        >
          <TextField label={m.note} fullWidth multiline minRows={4} />
        </TransactionBottomEditorDrawer>
      </>
    );
  },
};
