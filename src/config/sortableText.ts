export const sortableText = {
  instructions:
    "聚焦排序按钮后，使用上下方向键调整顺序。拖动时按 Escape 可取消。",
  announcements: {
    onDragStart: () => "已开始拖动排序。",
    onDragOver: () => "移动到目标位置后松手确认排序。",
    onDragEnd: () => "拖动已结束。",
    onDragCancel: () => "已取消拖动，顺序保持不变。",
  },
};
