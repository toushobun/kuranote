"use client";

import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import IconButton from "@mui/material/IconButton";

import { sortableText } from "config/sortableText";
import type { SortableHandleProps } from "../SortableItem";

export function SortableDragHandle({
  name,
  handleProps,
}: {
  name: string;
  handleProps: SortableHandleProps;
}) {
  return (
    <IconButton
      {...handleProps}
      aria-label={sortableText.handleLabel(name)}
      size="small"
      sx={{ cursor: "grab", touchAction: "none" }}
      type="button"
    >
      <DragIndicatorRoundedIcon fontSize="small" />
    </IconButton>
  );
}
