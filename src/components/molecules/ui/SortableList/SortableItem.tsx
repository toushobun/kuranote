"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box, { type BoxProps } from "@mui/material/Box";
import { useContext, type ComponentProps, type ReactNode } from "react";

import { designTokens } from "theme/theme";

import { SortableListContext } from "./SortableList";

export type SortableHandleProps = Pick<
  ComponentProps<"button">,
  | "ref"
  | "onPointerDown"
  | "onKeyDown"
  | "aria-describedby"
  | "aria-disabled"
  | "aria-keyshortcuts"
  | "disabled"
>;

export function SortableItem({
  id,
  children,
  sx,
}: {
  id: string;
  children: (handleProps: SortableHandleProps) => ReactNode;
  sx?: BoxProps["sx"];
}) {
  const { disabled, move } = useContext(SortableListContext);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
    transition: { duration: 200, easing: "ease" },
  });

  return (
    <Box
      ref={setNodeRef}
      data-sortable-id={id}
      data-dragging={isDragging || undefined}
      style={{
        transform: `${CSS.Translate.toString(transform) ?? ""}${isDragging ? " scale(1.01)" : ""}`,
        transition,
      }}
      sx={[
        {
          position: "relative",
          transformOrigin: "top center",
          borderRadius: `${designTokens.radius.item}px`,
          ...(isDragging && {
            bgcolor:
              "var(--user-theme-card-bg, var(--mui-palette-background-paper))",
            boxShadow: 3,
            zIndex: 1,
          }),
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none !important",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children({
        ref: setActivatorNodeRef,
        onPointerDown: (event) => listeners?.onPointerDown?.(event),
        "aria-describedby": attributes["aria-describedby"],
        "aria-disabled": disabled,
        "aria-keyshortcuts": "ArrowUp ArrowDown",
        disabled,
        onKeyDown: (event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          event.stopPropagation();
          move(id, event.key === "ArrowUp" ? -1 : 1);
        },
      })}
    </Box>
  );
}
