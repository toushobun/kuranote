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
  name: "拖拽调整排序",
  parameters: {
    docs: {
      description: {
        story:
          "按住手柄拖动，列表项跟随指针并实时让位，松手后更新顺序。支持鼠标与触屏操作。",
      },
    },
  },
};
export const Disabled: Story = {
  name: "禁用拖拽手柄",
  args: { handleProps: { disabled: true } },
};
