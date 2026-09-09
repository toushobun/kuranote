import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import { rectSortingStrategy } from "@dnd-kit/sortable";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import { designTokens } from "theme/theme";
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
export const WrappedGrid: Story = {
  name: "换行网格排序",
  args: {
    items: ["早餐", "外食", "食材", "咖啡", "零食", "日用品", "交通"],
  },
  parameters: {
    docs: {
      description: {
        story:
          "flex-wrap 布局使用 rectSortingStrategy，拖动跨行项目时按二维矩形位置实时让位。",
      },
    },
  },
  render: function Grid(args) {
    const [items, setItems] = useState(args.items);
    return (
      <SortableList
        {...args}
        items={items}
        onReorder={setItems}
        strategy={rectSortingStrategy}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            maxWidth: 420,
            p: 2,
          }}
        >
          {items.map((id) => (
            <SortableItem
              id={id}
              key={id}
              sx={{ display: "inline-flex", width: "auto" }}
            >
              {(handle) => (
                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: `${designTokens.radius.full}px`,
                    display: "inline-flex",
                    gap: 0.5,
                    pl: 1.5,
                    pr: 0.5,
                    py: 0.5,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {id}
                  </Typography>
                  <IconButton
                    {...handle}
                    aria-label={`调整${id}排序`}
                    size="small"
                    sx={{ cursor: "grab", touchAction: "none" }}
                  >
                    <DragIndicatorRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </SortableItem>
          ))}
        </Box>
      </SortableList>
    );
  },
};
