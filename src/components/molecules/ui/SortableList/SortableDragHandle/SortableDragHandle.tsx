"use client";

import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";

import { sortableText } from "config/sortableText";
import type { SortableHandleProps } from "../SortableItem";

export function SortableDragHandle({
  name,
  handleProps,
  sx,
}: {
  name: string;
  handleProps: SortableHandleProps;
  sx?: IconButtonProps["sx"];
}) {
  return (
    <IconButton
      {...handleProps}
      aria-label={sortableText.handleLabel(name)}
      size="small"
      sx={[
        { cursor: "grab", touchAction: "none" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      type="button"
    >
      <DragIndicatorRoundedIcon fontSize="small" />
    </IconButton>
  );
}
