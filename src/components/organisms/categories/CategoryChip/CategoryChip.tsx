"use client";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { defaultCategoryEmoji } from "config/categoryEmojis";
import type { SortableHandleProps } from "molecules/ui/SortableList/SortableItem";
import { SortableDragHandle } from "molecules/ui/SortableList/SortableDragHandle/SortableDragHandle";
import { designTokens } from "theme/theme";
import type { Category } from "types/categories";
import { getCategoryDisplayName } from "utils/categoryNames";

type CategoryItemActionsProps = {
  canManageCategories: boolean;
  category: Category;
  handleProps: SortableHandleProps;
  onEdit: (category: Category) => void;
};

export function CategoryItemActions({
  canManageCategories,
  category,
  handleProps,
  onEdit,
}: CategoryItemActionsProps) {
  if (!canManageCategories) return null;

  const displayName = getCategoryDisplayName(category.name, category.icon_name);

  return (
    <>
      <Tooltip title={`编辑${displayName}`}>
        <IconButton
          aria-label={`编辑${displayName}`}
          onClick={() => onEdit(category)}
          size="small"
          type="button"
        >
          <EditRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <SortableDragHandle name={displayName} handleProps={handleProps} />
    </>
  );
}

type CategoryChipProps = CategoryItemActionsProps;

export function CategoryChip({
  canManageCategories,
  category,
  handleProps,
  onEdit,
}: CategoryChipProps) {
  const displayName = getCategoryDisplayName(category.name, category.icon_name);
  const iconName = category.icon_name ?? defaultCategoryEmoji;

  return (
    <Box
      data-category-chip-id={category.id}
      sx={{
        alignItems: "center",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: `${designTokens.radius.full}px`,
        display: "inline-flex",
        gap: 0.5,
        maxWidth: "100%",
        minHeight: (theme) => theme.spacing(5),
        pl: 1.25,
        pr: 0.5,
        py: 0.5,
      }}
    >
      <Typography aria-hidden="true" component="span" sx={{ lineHeight: 1 }}>
        {iconName}
      </Typography>
      <Typography noWrap sx={{ fontWeight: 700, minWidth: 0 }} variant="body2">
        {displayName}
      </Typography>
      <CategoryItemActions
        canManageCategories={canManageCategories}
        category={category}
        handleProps={handleProps}
        onEdit={onEdit}
      />
    </Box>
  );
}
