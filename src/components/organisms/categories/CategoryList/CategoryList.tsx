"use client";

import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { PointerEvent, ReactNode } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import { defaultCategoryEmoji } from "config/categoryEmojis";
import { EmptyState } from "molecules/ui/EmptyState";
import type {
  CategoryAction,
  CategoryActionState,
  CategoryReorderAction,
  CategoryRow,
  CategoryTreeItem,
} from "types/categories";
import type { TransactionType } from "types/transactions";
import { getCategoryDisplayName } from "utils/categoryNames";

import { CategoryIconField } from "../CategoryIconField/CategoryIconField";
import { type CategoryMoveDirection, useCategoryList } from "./useCategoryList";

type CategoryListProps = {
  archiveCategoryAction: CategoryAction;
  canManageCategories?: boolean;
  categories: CategoryTreeItem[];
  onReorderError: (state: CategoryActionState) => void;
  reorderCategoryAction: CategoryReorderAction;
  updateCategoryAction: CategoryAction;
};

type CategoryRowItemProps = {
  canManageCategories: boolean;
  category: CategoryRow;
  childCount?: number;
  expanded?: boolean;
  isPending: boolean;
  nested?: boolean;
  dragging: boolean;
  onPointerCancel: () => void;
  onPointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    category: CategoryRow,
  ) => void;
  onPointerUp: (
    event: PointerEvent<HTMLButtonElement>,
    category: CategoryRow,
  ) => void;
  onEdit: (category: CategoryRow) => void;
  onMove: (category: CategoryRow, direction: CategoryMoveDirection) => void;
  onToggle?: () => void;
};

function CategoryRowItem({
  canManageCategories,
  category,
  childCount,
  expanded = false,
  isPending,
  nested = false,
  dragging,
  onPointerCancel,
  onPointerDown,
  onPointerUp,
  onEdit,
  onMove,
  onToggle,
}: CategoryRowItemProps) {
  const displayName = getCategoryDisplayName(category.name, category.icon_name);
  const iconName = category.icon_name ?? defaultCategoryEmoji;

  return (
    <Box
      data-category-row-id={category.id}
      sx={{
        borderTop: nested ? 1 : 0,
        borderColor: "var(--user-theme-card-border)",
        opacity: dragging ? 0.58 : 1,
        px: nested ? { xs: 1, sm: 2 } : 0,
        transition: "opacity 120ms ease",
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 0.5, sm: 1 }}
        sx={{ alignItems: "center", minHeight: nested ? 66 : 78, py: 1 }}
      >
        {onToggle ? (
          <IconButton
            aria-label={`${expanded ? "收起" : "展开"}${displayName}`}
            onClick={onToggle}
            size="small"
            type="button"
          >
            {expanded ? (
              <KeyboardArrowDownRoundedIcon />
            ) : (
              <KeyboardArrowRightRoundedIcon />
            )}
          </IconButton>
        ) : (
          <Box
            aria-hidden="true"
            sx={{
              alignItems: "center",
              color: "text.disabled",
              display: "flex",
              justifyContent: "center",
              width: 34,
            }}
          >
            <KeyboardArrowRightRoundedIcon fontSize="small" />
          </Box>
        )}

        <Box
          aria-hidden="true"
          sx={{
            alignItems: "center",
            bgcolor: "var(--user-theme-icon-badge-bg)",
            borderRadius: 2.5,
            display: "flex",
            flexShrink: 0,
            fontSize: nested ? "1.35rem" : "1.75rem",
            height: nested ? 42 : 52,
            justifyContent: "center",
            width: nested ? 42 : 52,
          }}
        >
          {iconName}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ fontWeight: nested ? 650 : 800 }}
            variant={nested ? "body1" : "subtitle1"}
          >
            {displayName}
          </Typography>
          {childCount !== undefined ? (
            <Typography color="text.secondary" variant="body2">
              {childCount} 个小分类
            </Typography>
          ) : null}
        </Box>

        {canManageCategories ? (
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
            <Tooltip title={`拖动${displayName}调整排序，也可使用上下方向键`}>
              <span>
                <IconButton
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  aria-label={`调整${displayName}排序`}
                  disabled={isPending}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      onMove(category, -1);
                    } else if (event.key === "ArrowDown") {
                      event.preventDefault();
                      onMove(category, 1);
                    }
                  }}
                  onPointerCancel={onPointerCancel}
                  onPointerDown={(event) => onPointerDown(event, category)}
                  onPointerUp={(event) => onPointerUp(event, category)}
                  size="small"
                  sx={{ cursor: "grab", touchAction: "none" }}
                  type="button"
                >
                  <DragIndicatorRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}

function CategorySection({ children }: { children: ReactNode }) {
  return (
    <SoftCard sx={{ overflow: "hidden", px: { xs: 1.25, sm: 2 }, py: 0 }}>
      {children}
    </SoftCard>
  );
}

export function CategoryList({
  archiveCategoryAction,
  canManageCategories = true,
  categories,
  onReorderError,
  reorderCategoryAction,
  updateCategoryAction,
}: CategoryListProps) {
  const {
    cancelDrag,
    childCount,
    closeEditor,
    draggedCategoryId,
    editingCategory,
    editingIconName,
    editingName,
    expandedIds,
    finishDrag,
    isPending,
    moveCategory,
    openEditor,
    selectedType,
    setEditingIconName,
    setEditingName,
    setSelectedType,
    startDrag,
    toggleCategory,
    visibleCategories,
  } = useCategoryList({
    categories,
    onReorderError,
    reorderCategoryAction,
  });

  if (categories.length === 0) {
    return (
      <EmptyState
        title="还没有分类"
        description={
          canManageCategories
            ? "先新增一个大分类，再在它下面新增小分类。"
            : "当前账本还没有可查看的分类。"
        }
      />
    );
  }

  return (
    <Stack spacing={2.5} sx={{ mt: 3 }}>
      <Tabs
        aria-label="分类类型"
        onChange={(_, value: TransactionType) => setSelectedType(value)}
        sx={{
          bgcolor: "var(--user-theme-segment-bg)",
          borderRadius: 999,
          minHeight: 48,
          p: 0.5,
          "& .MuiTab-root": {
            borderRadius: 999,
            minHeight: 40,
            textTransform: "none",
          },
          "& .Mui-selected": {
            bgcolor: "var(--user-theme-segment-selected-bg)",
            color: "var(--user-theme-segment-selected-text) !important",
          },
          "& .MuiTabs-indicator": { display: "none" },
        }}
        value={selectedType}
        variant="fullWidth"
      >
        <Tab label="支出分类" value="expense" />
        <Tab label="收入分类" value="income" />
      </Tabs>

      <Typography color="text.secondary" variant="body2">
        {visibleCategories.length} 个大分类 · {childCount} 个小分类
      </Typography>

      {visibleCategories.length === 0 ? (
        <EmptyState
          title={`还没有${selectedType === "expense" ? "支出" : "收入"}分类`}
          description="新增分类后会显示在这里。"
        />
      ) : (
        <Stack spacing={1.5}>
          {visibleCategories.map((category) => {
            const expanded = expandedIds.has(category.id);

            return (
              <CategorySection key={category.id}>
                <CategoryRowItem
                  canManageCategories={canManageCategories}
                  category={category}
                  childCount={category.children.length}
                  expanded={expanded}
                  dragging={draggedCategoryId === category.id}
                  isPending={isPending}
                  onPointerCancel={cancelDrag}
                  onPointerDown={startDrag}
                  onPointerUp={finishDrag}
                  onEdit={openEditor}
                  onMove={moveCategory}
                  onToggle={() => toggleCategory(category.id)}
                />
                {expanded ? (
                  category.children.length > 0 ? (
                    category.children.map((child) => (
                      <CategoryRowItem
                        canManageCategories={canManageCategories}
                        category={child}
                        dragging={draggedCategoryId === child.id}
                        isPending={isPending}
                        key={child.id}
                        nested
                        onPointerCancel={cancelDrag}
                        onPointerDown={startDrag}
                        onPointerUp={finishDrag}
                        onEdit={openEditor}
                        onMove={moveCategory}
                      />
                    ))
                  ) : (
                    <Typography
                      color="text.secondary"
                      sx={{
                        borderTop: 1,
                        borderColor: "divider",
                        px: 2,
                        py: 2,
                      }}
                      variant="body2"
                    >
                      还没有小分类。记账时只能选择小分类。
                    </Typography>
                  )
                ) : null}
              </CategorySection>
            );
          })}
        </Stack>
      )}

      <SoftCard
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          opacity: 0.78,
          p: 2.5,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <ArchiveRoundedIcon color="disabled" />
          <Box>
            <Typography sx={{ fontWeight: 700 }}>已隐藏分类</Typography>
            <Typography color="text.secondary" variant="body2">
              隐藏的分类不会在记账选择中显示。
            </Typography>
          </Box>
        </Stack>
      </SoftCard>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={closeEditor}
        open={editingCategory !== null}
      >
        <DialogTitle>编辑分类</DialogTitle>
        <DialogContent dividers>
          {editingCategory ? (
            <Stack
              component="form"
              action={updateCategoryAction}
              id="category-edit-form"
              spacing={2.5}
            >
              <input
                name="categoryId"
                type="hidden"
                value={editingCategory.id}
              />
              <TextField
                autoComplete="off"
                fullWidth
                label="分类名称"
                name="name"
                onChange={(event) => setEditingName(event.target.value)}
                required
                slotProps={{ htmlInput: { maxLength: 100 } }}
                value={editingName}
              />
              <CategoryIconField
                onChange={setEditingIconName}
                value={editingIconName}
              />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          {editingCategory && canManageCategories ? (
            <Stack component="form" action={archiveCategoryAction}>
              <input
                name="categoryId"
                type="hidden"
                value={editingCategory.id}
              />
              <Button color="error" type="submit">
                隐藏分类
              </Button>
            </Stack>
          ) : (
            <Box />
          )}
          <Stack direction="row" spacing={1}>
            <Button onClick={closeEditor} type="button">
              取消
            </Button>
            <Button
              disabled={!canManageCategories}
              form="category-edit-form"
              type="submit"
              variant="contained"
            >
              保存
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
