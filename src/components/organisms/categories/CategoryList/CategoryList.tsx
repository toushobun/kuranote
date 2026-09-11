"use client";

import { rectSortingStrategy } from "@dnd-kit/sortable";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { SoftCard } from "atoms/ui/SoftCard";
import {
  categoryArchiveConfirmMessages,
  categoryArchiveMessages,
  categorySearchMessages,
} from "config/categoryMessages";
import { defaultCategoryEmoji } from "config/categoryEmojis";
import { DestructiveSubmitButton } from "molecules/ui/DestructiveSubmitButton/DestructiveSubmitButton";
import { EmptyState } from "molecules/ui/EmptyState";
import { SortableList } from "molecules/ui/SortableList/SortableList";
import {
  SortableItem,
  type SortableHandleProps,
} from "molecules/ui/SortableList/SortableItem";
import { designTokens } from "theme/theme";
import type {
  CategoryAction,
  CategoryActionState,
  CategoryReorderAction,
  Category,
  CategoryTreeItem,
} from "types/categories";
import type { TransactionType } from "types/transactions";
import { getCategoryDisplayName } from "utils/categoryNames";

import {
  CategoryChip,
  CategoryItemActions,
} from "../CategoryChip/CategoryChip";
import { CategoryDialogActions } from "../CategoryDialogActions/CategoryDialogActions";
import { CategoryIconField } from "../CategoryIconField/CategoryIconField";
import { useCategoryActionSuccess } from "../useCategoryActionSuccess";
import { useCategoryList } from "./useCategoryList";

type CategoryListProps = {
  archiveCategoryAction: CategoryAction;
  archiveState?: CategoryActionState;
  canManageCategories?: boolean;
  categories: CategoryTreeItem[];
  onReorderError: (state: CategoryActionState) => void;
  reorderCategoryAction: CategoryReorderAction;
  updateCategoryAction: CategoryAction;
  updateState?: CategoryActionState;
};

type CategoryRowItemProps = {
  canManageCategories: boolean;
  category: Category;
  childCount?: number;
  expanded?: boolean;
  isPending: boolean;
  isExpansionForced: boolean;
  handleProps: SortableHandleProps;
  onEdit: (category: Category) => void;
  onToggle?: () => void;
};

function CategoryRowItem({
  canManageCategories,
  category,
  childCount,
  expanded = false,
  isPending,
  isExpansionForced,
  handleProps,
  onEdit,
  onToggle,
}: CategoryRowItemProps) {
  const displayName = getCategoryDisplayName(category.name, category.icon_name);
  const iconName = category.icon_name ?? defaultCategoryEmoji;

  return (
    <Box data-category-row-id={category.id}>
      <Stack
        direction="row"
        spacing={{ xs: 0.5, sm: 1 }}
        sx={{ alignItems: "center", minHeight: 78, py: 1 }}
      >
        {onToggle ? (
          <IconButton
            aria-label={`${expanded ? "收起" : "展开"}${displayName}`}
            disabled={isPending || isExpansionForced}
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
          data-testid="category-list-icon"
          sx={{
            alignItems: "center",
            bgcolor: "var(--user-theme-icon-badge-bg)",
            borderRadius: `${designTokens.radius.sm}px`,
            display: "flex",
            flexShrink: 0,
            fontSize: "1.75rem",
            height: 52,
            justifyContent: "center",
            width: 52,
          }}
        >
          {iconName}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 800 }} variant="subtitle1">
            {displayName}
          </Typography>
          {childCount !== undefined ? (
            <Typography color="text.secondary" variant="body2">
              {childCount} 个小分类
            </Typography>
          ) : null}
        </Box>

        <CategoryItemActions
          canManageCategories={canManageCategories}
          category={category}
          handleProps={handleProps}
          onEdit={onEdit}
        />
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
  archiveState,
  canManageCategories = true,
  categories,
  onReorderError,
  reorderCategoryAction,
  updateCategoryAction,
  updateState,
}: CategoryListProps) {
  const {
    closeEditor,
    editingCategory,
    editingIconName,
    editingName,
    renderedExpandedIds,
    forcedExpandedIds,
    isEditorOpen,
    isSearching,
    searchQuery,
    setSearchQuery,
    isPending,
    openEditor,
    requestCloseEditor,
    resetEditor,
    selectedType,
    setEditingIconName,
    setEditingName,
    setSelectedType,
    submitCategoryOrder,
    toggleCategory,
    visibleCategories,
  } = useCategoryList({
    categories,
    onReorderError,
    reorderCategoryAction,
  });

  useCategoryActionSuccess(updateState, closeEditor);
  useCategoryActionSuccess(archiveState, closeEditor);

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
      <SoftCard sx={{ borderRadius: `${designTokens.radius.full}px`, p: 0 }}>
        <TextField
          fullWidth
          placeholder={categorySearchMessages.placeholder}
          size="small"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          slotProps={{
            htmlInput: { "aria-label": categorySearchMessages.placeholder },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": { border: 0 },
            "& .MuiOutlinedInput-root": {
              borderRadius: `${designTokens.radius.full}px`,
              px: 0.75,
            },
          }}
        />
      </SoftCard>
      <Tabs
        aria-label="分类类型"
        onChange={(_, value: TransactionType) => setSelectedType(value)}
        sx={{
          bgcolor: "var(--user-theme-segment-bg)",
          borderRadius: `${designTokens.radius.full}px`,
          minHeight: 48,
          p: 0.5,
          "& .MuiTab-root": {
            borderRadius: `${designTokens.radius.full}px`,
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

      {visibleCategories.length === 0 ? (
        <EmptyState
          title={
            isSearching
              ? categorySearchMessages.emptyTitle
              : `还没有${selectedType === "expense" ? "支出" : "收入"}分类`
          }
          description={
            isSearching
              ? categorySearchMessages.emptyDescription
              : "新增分类后会显示在这里。"
          }
        />
      ) : (
        <SortableList
          key={selectedType}
          disabled={isPending || isSearching || !canManageCategories}
          items={visibleCategories.map((category) => category.id)}
          onReorder={(ids) => submitCategoryOrder(ids, null, selectedType)}
        >
          {(draggingRoots) => (
            <Stack spacing={1.5}>
              {visibleCategories.map((category) => {
                const expanded =
                  !draggingRoots && renderedExpandedIds.has(category.id);
                return (
                  <SortableItem
                    key={category.id}
                    id={category.id}
                    sx={{ borderRadius: `${designTokens.radius.lg}px` }}
                  >
                    {(handleProps) => (
                      <CategorySection>
                        <CategoryRowItem
                          canManageCategories={canManageCategories}
                          category={category}
                          childCount={category.children.length}
                          expanded={expanded}
                          isExpansionForced={forcedExpandedIds.has(category.id)}
                          isPending={isPending || draggingRoots}
                          handleProps={handleProps}
                          onEdit={openEditor}
                          onToggle={() => toggleCategory(category.id)}
                        />
                        {expanded ? (
                          category.children.length > 0 ? (
                            <SortableList
                              disabled={
                                isPending || isSearching || !canManageCategories
                              }
                              items={category.children.map((child) => child.id)}
                              onReorder={(ids) =>
                                submitCategoryOrder(
                                  ids,
                                  category.id,
                                  category.type,
                                )
                              }
                              strategy={rectSortingStrategy}
                            >
                              <Box
                                data-testid="category-chip-list"
                                sx={{
                                  borderTop: 1,
                                  borderColor: "divider",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1,
                                  py: 1.5,
                                }}
                              >
                                {category.children.map((child) => (
                                  <SortableItem
                                    key={child.id}
                                    id={child.id}
                                    sx={{
                                      display: "inline-flex",
                                      width: "auto",
                                    }}
                                  >
                                    {(childHandleProps) => (
                                      <CategoryChip
                                        canManageCategories={
                                          canManageCategories
                                        }
                                        category={child}
                                        handleProps={childHandleProps}
                                        onEdit={openEditor}
                                      />
                                    )}
                                  </SortableItem>
                                ))}
                              </Box>
                            </SortableList>
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
                    )}
                  </SortableItem>
                );
              })}
            </Stack>
          )}
        </SortableList>
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
            <Typography sx={{ fontWeight: 700 }}>
              {categoryArchiveMessages.title}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {categoryArchiveMessages.description}
            </Typography>
          </Box>
        </Stack>
      </SoftCard>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={requestCloseEditor}
        open={isEditorOpen}
        slotProps={{ transition: { onExited: resetEditor } }}
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
        <CategoryDialogActions
          disabled={!canManageCategories}
          form="category-edit-form"
          onCancel={requestCloseEditor}
          submitLabel="保存"
        >
          {editingCategory && canManageCategories ? (
            <Stack component="form" action={archiveCategoryAction}>
              <input
                name="categoryId"
                type="hidden"
                value={editingCategory.id}
              />
              <DestructiveSubmitButton
                confirmLabel={categoryArchiveConfirmMessages.confirm}
                description={categoryArchiveConfirmMessages.description}
                fullWidth
                label={categoryArchiveMessages.action}
                startIcon={<ArchiveRoundedIcon />}
                title={categoryArchiveConfirmMessages.title}
              />
            </Stack>
          ) : null}
        </CategoryDialogActions>
      </Dialog>
    </Stack>
  );
}
