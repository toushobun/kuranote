export const sortableText = {
  handleLabel: (name: string) => `调整${name}排序`,
  instructions: "按住排序按钮拖动调整顺序。拖动时按 Escape 可取消。",
  announcements: {
    onDragStart: () => "已开始拖动排序。",
    onDragOver: () => "移动到目标位置后松手确认排序。",
    onDragEnd: () => "拖动已结束。",
    onDragCancel: () => "已取消拖动，顺序保持不变。",
  },
};
