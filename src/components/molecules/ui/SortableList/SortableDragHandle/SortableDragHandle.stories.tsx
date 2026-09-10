import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { SortableItem } from "../SortableItem";
import { SortableList } from "../SortableList";
import { SortableDragHandle } from "./SortableDragHandle";

const meta = {
  title: "Molecules/UI/SortableDragHandle",
  component: SortableDragHandle,
  args: { name: "餐饮", handleProps: {} },
  render: function Interactive(args) {
    const [items, setItems] = useState([args.name, "日用"]);
    return (
      <SortableList
        disabled={args.handleProps.disabled}
        items={items}
        onReorder={setItems}
      >
        <Stack spacing={1} sx={{ width: 280 }}>
          {items.map((name) => (
            <SortableItem id={name} key={name}>
              {(handleProps) => (
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1,
                  }}
                >
                  <Typography>{name}</Typography>
                  <SortableDragHandle name={name} handleProps={handleProps} />
                </Stack>
              )}
            </SortableItem>
          ))}
        </Stack>
      </SortableList>
    );
  },
} satisfies Meta<typeof SortableDragHandle>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  name: "拖动后移开提示消失",
  parameters: {
    docs: {
      description: {
        story:
          "悬停显示排序说明；拖动松手后移开指针，提示消失。Tab 聚焦手柄不会打开提示，触屏长按提示在松手后自动消失。",
      },
    },
  },
};
export const Disabled: Story = {
  name: "禁用拖拽手柄",
  args: { handleProps: { disabled: true } },
};
