"use client";

import {
  closestCenter,
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { createContext, useId, useState, type ReactNode } from "react";

import { sortableText } from "config/sortableText";

export const SortableListContext = createContext<{
  disabled: boolean;
  dragging: boolean;
}>({
  disabled: false,
  dragging: false,
});

// 只在本组列表范围内寻找目标，避免离开小分类后误提交到最近的兄弟项。
const collisionDetection: CollisionDetection = (args) => {
  const point = args.pointerCoordinates;
  const rects = [...args.droppableRects.values()];
  if (!point || !rects.length) return [];
  if (
    point.x < Math.min(...rects.map((rect) => rect.left)) ||
    point.x > Math.max(...rects.map((rect) => rect.right)) ||
    point.y < Math.min(...rects.map((rect) => rect.top)) ||
    point.y > Math.max(...rects.map((rect) => rect.bottom))
  )
    return [];

  return closestCenter({
    ...args,
    collisionRect: {
      left: point.x,
      right: point.x,
      top: point.y,
      bottom: point.y,
      width: 0,
      height: 0,
    },
  });
};

type SortableListProps = {
  children: ReactNode | ((dragging: boolean) => ReactNode);
  disabled?: boolean;
  items: string[];
  onReorder: (ids: string[]) => void;
  strategy?: SortingStrategy;
};

export function SortableList({
  children,
  disabled = false,
  items,
  onReorder,
  strategy = verticalListSortingStrategy,
}: SortableListProps) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function reorder(source: number, target: number) {
    if (
      disabled ||
      source < 0 ||
      target < 0 ||
      target >= items.length ||
      source === target
    )
      return;
    onReorder(arrayMove(items, source, target));
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{
        screenReaderInstructions: { draggable: sortableText.instructions },
        announcements: sortableText.announcements,
      }}
      onDragStart={() => setDragging(true)}
      onDragCancel={() => setDragging(false)}
      onDragEnd={({ active, over }) => {
        setDragging(false);
        if (over)
          reorder(
            items.indexOf(String(active.id)),
            items.indexOf(String(over.id)),
          );
      }}
    >
      <SortableListContext.Provider
        value={{
          disabled,
          dragging,
        }}
      >
        <SortableContext items={items} strategy={strategy}>
          {typeof children === "function" ? children(dragging) : children}
        </SortableContext>
      </SortableListContext.Provider>
    </DndContext>
  );
}
