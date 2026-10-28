import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { TransactionBottomEditorDrawer } from "./TransactionBottomEditorDrawer";
const noteTitle = "备注";
const meta = {
  title: "Molecules/Transactions/TransactionBottomEditorDrawer",
  component: TransactionBottomEditorDrawer,
  args: { open: true, title: noteTitle, onClose: () => {}, children: null },
} satisfies Meta<typeof TransactionBottomEditorDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Note: Story = {
  name: "共用底部编辑抽屉",
  render: function NoteDrawer(args) {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>{noteTitle}</Button>
        <TransactionBottomEditorDrawer
          {...args}
          open={open}
          onClose={() => setOpen(false)}
        >
          <TextField label={noteTitle} fullWidth multiline minRows={4} />
        </TransactionBottomEditorDrawer>
      </>
    );
  },
};
