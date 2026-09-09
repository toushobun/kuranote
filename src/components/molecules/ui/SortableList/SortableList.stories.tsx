import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import { SortableList } from "./SortableList";
import { SortableItem } from "./SortableItem";

const meta = {
  title: "Molecules/UI/SortableList",
  component: SortableList,
  args: {
    items: ["餐饮", "日用", "出行"],
    onReorder: () => {},
    children: null,
  },
  render: function Interactive(args) {
    const [items, setItems] = useState(args.items);
    return (
      <SortableList {...args} items={items} onReorder={setItems}>
        <Stack spacing={1.5} sx={{ maxWidth: 480, p: 2 }}>
          {items.map((id) => (
            <SortableItem id={id} key={id}>
              {(handle) => (
                <SoftCard sx={{ p: 2 }}>
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography>{id}</Typography>
                    <IconButton
                      {...handle}
                      aria-label={`调整${id}排序`}
                      sx={{ cursor: "grab", touchAction: "none" }}
                    >
                      <DragIndicatorRoundedIcon />
                    </IconButton>
                  </Stack>
                </SoftCard>
              )}
            </SortableItem>
          ))}
        </Stack>
      </SortableList>
    );
  },
} satisfies Meta<typeof SortableList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { name: "跟手抬起与实时让位" };
export const Disabled: Story = {
  name: "提交中禁用排序",
  args: { disabled: true },
};
